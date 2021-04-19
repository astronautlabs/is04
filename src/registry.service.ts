import { Injectable } from "@alterior/di";
import { Service } from "./dns-sd";
import { RegistrationResult, Registry } from "./registry";
import { Device, Flow, Node, Receiver, ResourceCore, Sender, Source } from "./schema";
import * as mdns from 'mdns';
import { NodeApi } from "./node-api";
import { WebServer } from "@alterior/web-server";
import { v4 as uuid } from 'uuid';
import * as os from 'os';
import * as tai from '@1500cloud/taitimestamp';

@Injectable()
export class RegistryService {
    constructor() {
    }

    nodeApi : NodeApi;

    private _node : Node;
    private _sources : Source[] = [];
    private _devices : Device[] = [];
    private _senders : Sender[] = [];
    private _receivers : Receiver[] = [];
    private _flows : Flow[] = [];
    
    private _registered = false;
    private _searchDomain : string;
    private _registryServices : Service[];
    private _registry : Registry;

    get sources() { return this._sources; }
    get devices() { return this._devices; }
    get senders() { return this._senders; }
    get receivers() { return this._receivers; }
    get flows() { return this._flows; }

    private _nodeVersion = 0;
    private _sourceVersion = 0;
    private _flowVersion = 0;
    private _deviceVersion = 0;
    private _senderVersion = 0;
    private _receiverVersion = 0;
    private _multicastRegistryServices : Service[] = [];

    private _allowMulticast = true;

    get allowMulticast() {
        return this._allowMulticast;
    }

    set allowMulticast(value) {
        this._allowMulticast = value;
        if (!this._allowMulticast)
            this.stopMulticast();
    }

    private stopMulticast() {
        if (this._registryBrowser) {
            this._registryBrowser.stop();
            this._registryBrowser = null;
        }
    }

    private async startMulticast() {
        if (!this.allowMulticast)
            return;
        
        if (this._registryBrowser)
            return;
        
        this._registryBrowser = mdns.createBrowser(mdns.tcp('nmos-register'));

        let reactionTimeout;
        let registering = false;
        
        this._registryBrowser.on('serviceUp', service => {
            if (!this._multicastRegistryServices.some(x => x.name === service.name)) {
                this._multicastRegistryServices.push(new Service(service.name, service.addresses[0], service.port, service.txtRecord['pri'], 100, service.txtRecord, 0));
                this.log(`Registry is up: ${service.name} @ ${service.txtRecord['api_proto']}://${service.addresses[0]}:${service.port} (${service.txtRecord['api_ver']})`);
     
                if (!this._registry) {
                    // a new registry service came online, try to use registered mode

                    clearTimeout(reactionTimeout);
                    reactionTimeout = setTimeout(async () => {
                        if (this._registry || registering)
                            return;
                        registering = true;

                        let gracePeriod = Math.floor(Math.random() * 500);
                        await this.sleep(gracePeriod);
                        
                        this.log(`P2P: Attempting to switch to registered mode`);
                        try {
                            await this.register();
                        } finally {
                            registering = false;
                        }
                    }, 1000);
                }

            }
        });

        this._registryBrowser.on('serviceDown', async service => {
            if (!this._multicastRegistryServices.some(x => x.name === service.name))
                return;
            
            this.log(`Registry is down: ${service.name}`);

            this._multicastRegistryServices = this._multicastRegistryServices.filter(x => x.name !== service.name);
            this._registryServices = this._registryServices.filter(x => x.name !== service.name);

            if (this._registry && this._registry.service.name === service.name) {
                // uh oh, our registry just went down
                this.logError(`Registry ${this._registry.url} reports it is going down, choosing a new one`);

                // If there are no more known registry services, clear registration status 
                if (this._registryServices.length === 0) {
                    console.log(`No more known registry instances, clearing registration status`);
                    this._registered = false;
                }

                // Try to scan for new registry instances
                
                this._registry = await this.getRegistry();

                await this.register();
            }
        });

        this._registryBrowser.start();
        await this.sleep(2000);
    }

    private async queryForRegistryServices() {
        await this.startMulticast();

        let services : Service[] = [];
        if (this._searchDomain)
            services = await Service.browseUnicast('nmos-register', 'tcp', this._searchDomain);
            
        return services.concat(this._multicastRegistryServices);
    }

    /**
     * Must be called whenever a resource is updated. This is used 
     * to reflect the update of the resource with the registry service
     * (or to advertise the update when in peer to peer mode)
     * @param resource 
     */
    async updateResource(resource : ResourceCore) {
        resource.version = this.nowTAI();

        let type = this.getTypeOfResource(resource);
        if (!type)
            throw new Error(`Failed to determine type of resource with ID ${resource.id}, has it been added to the registry? You must pass the same object that you passed to add()`);
        
        this[`_${type}Version`] = (this[`_${type}Version`] + 1) % 256;

        if (this._nodeAdvert)
            this.updateNodeAdvertisement();

        if (this._registry)
            await this._registry.register(type, resource);
    }

    getTypeOfResourceById(id : string) {
        if (this._node.id === id)
            return 'node';
        let collections = { 
            sources: 'source', devices: 'device', senders: 'sender', receivers: 'receiver', flows: 'flow' 
        };

        for (let coll of Object.keys(collections)) 
            if ((<ResourceCore[]>this[coll]).some(x => x.id === id))
                return collections[coll];
        
        return null;
    }

    getResourceById(id : string) {
        if (this._node.id === id)
            return this._node;
        
        let collections = ['sources', 'devices', 'senders', 'receivers', 'flows'];

        for (let coll of collections) {
            let match = (<ResourceCore[]>this[coll]).find(x => x.id === id);
            if (match)
                return match;
        }

        return null;
    }

    getTypeOfResource(resource : ResourceCore) {
        if (this._node === resource)
            return 'node';
        let collections = { 
            sources: 'source', devices: 'device', senders: 'sender', receivers: 'receiver', flows: 'flow' 
        };

        for (let coll of Object.keys(collections)) 
            if ((<ResourceCore[]>this[coll]).includes(resource))
                return collections[coll];
        
        return null;
    }

    set node(value) {
        if (this._registered)
            throw new Error(`You cannot change the node reference after it has already been registered`);
        this._node = value;
    }

    get node() {
        return this._node;
    }
    get searchDomain() {
        return this._searchDomain;
    }

    set searchDomain(value) {
        this._searchDomain = value;
    }

    private log(message : string) {
        console.log(`[NMOS IS-04] INFO :: ${message}`);
    }

    private logWarn(message : string) {
        console.warn(`[NMOS IS-04] WARN :: ${message}`);
    }

    private logError(message : string) {
        console.error(`[NMOS IS-04] ERROR :: ${message}`);
    }

    private async findAcceptableRegistry(refresh = false) {
        this._registryServices = await this.queryForRegistryServices();
        return await Service.select(this._registryServices, s => Registry.accept(s));
    }

    private async getRegistry() {
        if (this._registry)
            return this._registry;

        this._registry = await this.findAcceptableRegistry();

        // If we couldn't obtain a registry with our current set, try again 
        // with refresh 

        if (!this._registry)
            this._registry = await this.findAcceptableRegistry(true);

        if (this._registry) {
            this.log(`Selected registry ${this._registry.url}`);

            // Now that we have a registry, stop advertising the node in p2p mode

            clearInterval(this.retryRegistryInterval);
            if (this._nodeAdvert) {
                this.log(`[NMOS IS-04] [P2P]: Stopping node advertisement...`);
                this._nodeAdvert.stop();
                this._nodeAdvert = null;
            }
        }
        
        return this._registry;
    }

    private async handleRegistryError(error : Error, inBand = true) {

        if (error.message.startsWith('Client error:')) {
            this.logError(`Registry reported: ${error.message}`);
            console.error(error);

            throw error;
        }

        if (this._registry) {
            // mark this registry as ignored and select another one,
            // taking care to re-register when we find another one
            this.logError(`Received error from registry: '${error.message}', will be ignored for 15 seconds`);
            this._registry.service.ignore(`Error ${error}`, 45*1000);

            // Set _registry to null before unregistering so that we don't try to 
            // communicate with the defective registry
            this._registry = null;
        }

        this._registry = await this.getRegistry();

        if (!this._registry) {
            this._registered = false;
            this.enterP2P();
        }

        if (inBand)
            throw new Error(`registry-malfunction: The registry malfunctioned: ${error.message}`);
    }

    _registryBrowser : mdns.Browser;

    async unregister() {
        if (!this._registry)
            return;

        try {
            this.log(`Unregistering...`);

            for (let device of this._devices)
                await this._registry.delete('devices', device.id);
            for (let source of this._sources)
                await this._registry.delete('sources', source.id);
            for (let flow of this._flows)
                await this._registry.delete('flows', flow.id);
            for (let sender of this._senders)
                await this._registry.delete('senders', sender.id);
            for (let receiver of this._receivers)
                await this._registry.delete('receivers', receiver.id);
            
            await this._registry.delete('nodes', this.node.id);
        } catch (e) {
            this.logError(`Caught error while trying to unregister: ${e.message}, unregistration will be skipped`);
            console.error(e);
        }
    }

    private _isRegistered;
    private _heartbeatTimer;
    private _heartbeatTime = 1000*5;

    /**
     * Retrieve the time interval between each heartbeat, which defaults to the recommended 5 seconds
     */
    get heartbeatTime() {
        return this._heartbeatTime;
    }

    set heartbeatTime(value) {
        this._heartbeatTime = value;
    }

    get isRegistered() {
        return this._isRegistered;
    }

    private _sendingHeartbeat = false;
    private async sendHeartbeat() {
        if (this._sendingHeartbeat)
            return;
        this._sendingHeartbeat = true;

        try {
            while (true) {
                if (!this._registry)
                    return;

                this.log(`Sending heartbeat to registry ${this._registry.url}`);

                try {
                    await this._registry.heartbeat(this.node.id, this._heartbeatTime);
                } catch (e) {
                    // Note that the registry has errored, 
                    // select a new registry and try the heartbeat again

                    await this.handleRegistryError(e, false);
                    continue;
                }

                break;
            }
        } finally {
            this._sendingHeartbeat = false;
        }
    }

    private async sleep(time : number) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), time));
    }

    private nowTAI() {
        return tai.taiTimestampToMediaTimestamp(tai.now());
    }

    async init() {
        if (!this.nodeApi)
            throw new Error(`Cannot initialize: Node API is not registered. You must mount NodeApi onto a WebService`);

        let server = WebServer.for(this.nodeApi);
        let osInterfaces = os.networkInterfaces();
        let interfaces : any[] = [];

        for (let ifName of Object.keys(osInterfaces)) {
            let protocols = osInterfaces[ifName];
            let iface = protocols[0];

            interfaces.push({
                name: ifName,
                chassis_id: iface.mac.replace(/:/g, '-'),
                port_id: iface.mac.replace(/:/g, '-')
            });
        }

        this._node = {
            id: uuid(),
            hostname: os.hostname(),
            version: this.nowTAI(),
            caps: {},
            href: `http://${os.hostname()}:${server.options.port}/`,
            api: {
                versions: ["v1.3"],
                endpoints: [
                    {
                        host: os.hostname(),
                        port: server.options.port,
                        protocol: "http"
                    }
                ]
            },

            label: os.hostname(),
            description: "No description provided",
            tags: {},
            services: [],
            clocks: [
                {
                    name: "clk0",
                    ref_type: "internal"
                }
            ],
            interfaces
        }
    }

    async register() {
        
        if (!this._heartbeatTimer) {
            this.log(`Starting heartbeat at ${this._heartbeatTime}ms`);
            await this.sendHeartbeat();
            this._heartbeatTimer = setInterval(() => this.sendHeartbeat(), this._heartbeatTime);
        }

        if (!this._registry)
            this._registry = await this.getRegistry();

        if (this._registered)
            return;
        
        do {
            try {
                await this.attemptToRegister()
            } catch (e) {
                if (e.message.startsWith('registry-malfunction:')) {
                    continue;
                } else if (e.message.startsWith('reregister-required')) {
                    this.log(`Registry indicates node ${this.node.id} is already registered. Re-registering...`);

                    this.log(`[Fixup] De-registering node ${this.node.id}`);
                    await this.unregister();
                    
                    this.log(`[Fixup] Re-registering node ${this.node.id}`);
                    await this.register();
                    break;
                }

                throw e;
            }

            break;
        } while (true);
    }

    retryRegistryInterval;
    expireRegistrationTimeout;

    private async attemptToRegister() {
        if (!this._node)
            throw new Error(`Cannot register until node property has been set`);
        
        if (this._isRegistered)
            await this.unregister();

        if (!this.nodeApi) {
            throw new Error(`Cannot register because NodeApi was not mounted into a WebService`);
        }

        this.log(`Registering...`);

        let registry = await this.getRegistry();

        if (!registry) {
            this.enterP2P();
            return;
        }
    
        this.log(`Found registry ${registry.url}. Registering node ${this.node.id}...`);

        let result : RegistrationResult<Node>;

        result = await this.registerResource('node', this.node);

        if (result.status === 'already-registered') {
            // unregister and re-register
            // https://specs.amwa.tv/is-04/releases/v1.3/docs/4.1._Behaviour_-_Registration.html#node-encounters-http-200-on-first-registration
            throw new Error(`reregister-required`);
        }

        this.log(`Registering resources...`);

        for (let device of this._devices)
            await this.registerResource('device', device);
        for (let source of this._sources)
            await this.registerResource('source', source);
        for (let flow of this._flows)
            await this.registerResource('flow', flow);
        for (let sender of this._senders)
            await this.registerResource('sender', sender);
        for (let receiver of this._receivers)
            await this.registerResource('sender', receiver);

        this._registered = true;
    }

    private enterP2P() {
        // peer-to-peer mode
        this.log(`No registry service found, using peer-to-peer mode`);

        // Periodically retry the registration service search so we can 
        // return to registered mode (every 60s). This is needed in addition
        // to monitoring new registry advertisements, because some of those 
        // registries may be ignored due to errors on their end. We do want to
        // reconnect to such a registry after the problem has been solved, even
        // if there are no new registry advertisements received.

        clearInterval(this.retryRegistryInterval);
        this.retryRegistryInterval = setInterval(async () => {
            if (this._registry) {
                clearInterval(this.retryRegistryInterval);
                return;
            }

            if (await this.findAcceptableRegistry(true))
                await this.register();
        }, 60*1000);

        // If we can't reconnect to the registry within two heartbeat cycles, 
        // assume our registration is lost and that we should re-register next
        // time we find the registry 
        // The recommended garbage collection time on the registry is 12 seconds 
        // (2 heartbeats of 5 seconds + 2 seconds), so this is reasonable

        if (this._registered) {
            clearInterval(this.expireRegistrationTimeout);
            this.expireRegistrationTimeout = setTimeout(async () => {
                if (this._registry)
                    return;
                
                if (this._registered) {
                    this._registered = false;
                    this.log(`Previous registration has expired.`);
                }
            }, this._heartbeatTime*2);
        }

        // Create/update our node advertisement so this node can participate in 
        // distributed discovery/querying

        this.updateNodeAdvertisement();
    }

    private updateNodeAdvertisement() {
        if (!this.nodeApi)
            throw new Error(`Cannot update Node advertisement: NodeApi must be mounted on a WebService to determine port!`);

        if (this._nodeAdvert) {
            this._nodeAdvert.stop();
            this._nodeAdvert = null;
            this.log(`P2P: Updating node advertisement...`);
        } else {
            this.log(`P2P: Advertising node...`);
        }

        let port = WebServer.for(this.nodeApi).options.port;
        this._nodeAdvert = mdns.createAdvertisement(
            mdns.tcp('nmos-node'), 
            port, 
            {

                txtRecord: {
                    api_proto: 'http',
                    api_ver: 'v1.3',
                    api_auth: 'false',
                    ver_slf: this._nodeVersion,
                    ver_src: this._sourceVersion,
                    ver_flw: this._flowVersion,
                    ver_dvc: this._deviceVersion,
                    ver_snd: this._senderVersion,
                    ver_rcv: this._receiverVersion
                }
            }, 
            (error, service) => {
                if (error) {
                    this.logError(`[NMOS IS-04] P2P: Failed to announce Node:`);
                    console.error(error);
                }
            }
        );
    }

    private _nodeAdvert : mdns.Advertisement;

    private async registerResource(type : string, resource : any) {
        if (this._registered) {
            let registry = await this.getRegistry();
            if (!registry)
                return;
            
            try {
                return await registry.register(type, resource);
            } catch (e) {
                await this.handleRegistryError(e, true);
            }
        }

        await this.updateResource(resource);
    }

    async addSource(source : Partial<Source>) {
        if (!source.id)
            source.id = uuid();
        this._sources.push(<Source>source);
        await this.registerResource('source', source);
        return <Source>source;
    }

    async addDevice(device : Partial<Device>) {
        if (!device.id)
            device.id = uuid();
        this._devices.push(<Device>device);
        await this.registerResource('device', device);
        return <Device>device;
    }

    async addFlow(flow : Partial<Flow>) {
        if (!flow.id)
            flow.id = uuid();
        this._flows.push(<Flow>flow);
        await this.registerResource('flow', flow);
        return <Flow>flow;
    }

    async addSender(sender : Partial<Sender>) {
        if (!sender.id)
            sender.id = uuid();
        this._senders.push(<Sender>sender);
        await this.registerResource('sender', sender);
        return <Sender>sender;
    }

    async addReceiver(receiver : Partial<Receiver>) {
        if (!receiver.id)
            receiver.id = uuid();
        this._receivers.push(<Receiver>receiver);
        await this.registerResource('sender', receiver);
        return <Receiver>receiver;
    }
}