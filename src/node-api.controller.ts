import { Controller, Get } from '@alterior/web-server';
import { Device, Flow, Node, Receiver, Sender, Source } from './schema';
import { Service } from './dns-sd';
import { Registry } from './registry';

@Controller('/x-nmos/node/:version')
export class NodeService {

    private _node : Node;
    private _registered = false;
    private _sources : Source[];
    private _devices : Device[];
    private _senders : Sender[];
    private _receivers : Receiver[];
    private _flows : Flow[];

    set node(value) {
        if (this._registered)
            throw new Error(`You cannot change the node reference after it has already been registered`);
        this._node = value;
    }

    get node() {
        return this._node;
    }

    private _searchDomain : string;
    private _registryServices : Service[];
    private _registry : Registry;

    get searchDomain() {
        return this._searchDomain;
    }

    set searchDomain(value) {
        this._searchDomain = value;
    }

    private async getRegistry() {
        if (this._registry)
            return this._registry;

        if (!this._registryServices)
            this._registryServices = await Registry.locate();
        
        let registryService = Service.select(this._registryServices);
        if (registryService)
            this._registry = new Registry(registryService);
        
        return this._registry;
    }

    private async handleRegistryError(error : Error) {
        // mark this registry as ignored and select another one,
        // taking care to re-register when we find another one
        this._registry.service.ignore();
        await this.getRegistry();
        this.register();
    }

    async unregister() {

        clearInterval(this._heartbeatTimer);
        this._heartbeatTimer = 0;

        let registry = await this.getRegistry();
        
        if (registry) {
            for (let device of this._devices)
                await registry.delete('devices', device.id);
            for (let source of this._sources)
                await registry.delete('sources', source.id);
            for (let flow of this._flows)
                await registry.delete('flows', flow.id);
            for (let sender of this._senders)
                await registry.delete('senders', sender.id);
            for (let receiver of this._receivers)
                await registry.delete('senders', receiver.id);
            
            await registry.delete('nodes', this.node.id);
        } else {
            // peer to peer
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

    private async sendHeartbeat() {
        let registry = await this.getRegistry();
        registry.heartbeat(this.node.id);
    }

    async register() {
        if (this._isRegistered) {
            await this.unregister();
        }

        let registry = await this.getRegistry();
        if (registry) {
            let result = await this.registerResource('node', this.node);

            if (result.status === 'already-registered') {
                // unregister and re-register
                // https://specs.amwa.tv/is-04/releases/v1.3/docs/4.1._Behaviour_-_Registration.html#node-encounters-http-200-on-first-registration
                await registry.delete('nodes', this.node.id);
                await this.register();
                return;
            }

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

            this._heartbeatTimer = setInterval(() => this.sendHeartbeat(), this._heartbeatTime);

        } else {
            // peer-to-peer mode
            console.log(`No registry service found, using peer-to-peer mode`);
        }
    }

    private async registerResource(type : string, resource : any) {
        let registry = await this.getRegistry();;
        try {
            return await registry.register(type, resource);
        } catch (e) {
            // TODO: appropriate to crash on 4xx
            // https://specs.amwa.tv/is-04/releases/v1.3/docs/4.1._Behaviour_-_Registration.html#node-encounters-http-400-or-other-undocumented-4xx-on-registration

            this.handleRegistryError(e);
        }
    }

    async addSource(source : Source) {
        this._sources.push(source);
        if (this._registered) {
            // TODO: send registration here
        }
    }

    async addDevice(device : Device) {
        this._devices.push(device);
        await this.registerResource('device', device);
    }

    async addFlow(flow : Flow) {
        this._flows.push(flow);
        await this.registerResource('flow', flow);
    }

    async addSender(sender : Sender) {
        this._senders.push(sender);
        await this.registerResource('sender', sender);
    }

    async addReceiver(receiver : Receiver) {
        this._receivers.push(receiver);
        await this.registerResource('sender', receiver);
    }

    @Get('/')
    root() {
        return [
            'self/',
            'sources/',
            'flows/',
            'devices/',
            'senders/',
            'receivers/'
        ];
    }

    @Get('/self')
    self(): Node {
        return this.node;
    }
}