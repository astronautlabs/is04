import { Injectable } from "@alterior/di";
import * as mdns from 'mdns';
import { clientFor, RestClient } from "./alterior-web-client";
import { Service } from "./dns-sd";
import { NodeApi } from "./node-api";
import { Query, QueryInterface } from "./query";
import { QueryApi } from "./query-api";
import { Source, Flow, Device, Sender, Receiver, Node, ResourceCore } from "./schema";

export class DynamicQuery implements QueryInterface {
    constructor(
        private queryService : QueryService
    ) {
    }

    async queryNodes(options?: any): Promise<Node[]> {
        return this.queryService.nodes;
    }

    async querySources(options?: any): Promise<Source[]> {
        return this.queryService.sources;
    }

    async queryFlows(options?: any): Promise<Flow[]> {
        return this.queryService.flows;
    }

    async queryDevices(options?: any): Promise<Device[]> {
        return this.queryService.devices;
    }

    async querySenders(options?: any): Promise<Sender[]> {
        return this.queryService.senders;
    }

    async queryReceivers(options?: any): Promise<Receiver[]> {
        return this.queryService.receivers;
    }

    getNode(id: string): Promise<Node> {
        throw new Error("Method not implemented.");
    }
    getSource(id: string): Promise<Source> {
        throw new Error("Method not implemented.");
    }
    getFlow(id: string): Promise<Flow> {
        throw new Error("Method not implemented.");
    }
    getDevice(id: string): Promise<Device> {
        throw new Error("Method not implemented.");
    }
    getSender(id: string): Promise<Sender> {
        throw new Error("Method not implemented.");
    }
    getReceiver(id: string): Promise<Receiver> {
        throw new Error("Method not implemented.");
    }

}

export interface NodeState {
    id : string;
    service : Service;
    version : string;
    node : Node;
    fetchedAt : number;
    lastUpdated : number;
    devices : Device[];
    sources : Source[];
    flows : Flow[];
    senders : Sender[];
    receivers : Receiver[];
    url : string;
    client : RestClient<NodeApi>;
}

@Injectable()
export class QueryService {
    constructor() {

    }

    private _multicastQueryServices : Service[] = [];
    private _queryServices : Service[];

    public queryApi : QueryApi;
    public allowMulticast = true;

    private async queryForQueryServices() {
        await this.startMulticast();

        let services : Service[] = [];
        if (this._searchDomain)
            services = await Service.browseUnicast('nmos-query', 'tcp', this._searchDomain);
            
        return services.concat(this._multicastQueryServices);
    }
    
    private _searchDomain : string;
    private _queryServiceBrowser : mdns.Browser;
    private _query : QueryInterface;

    get query() {
        return this._query;
    }

    private log(message : string) {
        console.log(`[NMOS IS-04 Query] INFO :: ${message}`);
    }

    private logError(message : string) {
        console.error(`[NMOS IS-04 Query] ERROR :: ${message}`);
    }

    private async sleep(time : number) {
        await new Promise<void>(resolve => setTimeout(() => resolve(), time));
    }

    private getNodeFromAnnouncement(service : Service) {
        let item = this._nodeStates.find(x => x.id === service.name);
        if (!item) {
            let url = `${service.metadata['api_proto'] || 'http'}://${service.hostname}:${service.port}`;
            this._nodeStates.push(item = { 
                id: service.name,
                version: service.metadata['api_ver'] || 'vU',
                service: null, 
                node: null, 
                fetchedAt: null, 
                lastUpdated: null,
                devices: [], 
                flows: [],
                receivers: [],
                senders: [],
                sources: [],
                url,
                client: clientFor(NodeApi, url)
            });
        }

        return item;
    }

    private async handleMulticastAnnounce(service : mdns.Service) {
        let announcement = Service.fromMulticast(service);
        return await this.handleNodeUpdate(announcement, this.getNodeFromAnnouncement(announcement));
    }

    private async startMulticast() {
        if (!this.allowMulticast)
            return;
        
        if (this._queryServiceBrowser)
            return;
        
            
        let reactionTimeout;
        let registering = false;
            
        this._queryServiceBrowser = mdns.createBrowser(mdns.tcp('nmos-register'));
        this._queryServiceBrowser.on('serviceUp', service => {
            if (!this._multicastQueryServices.some(x => x.name === service.name)) {
                this._multicastQueryServices.push(new Service(service.name, service.addresses[0], service.port, service.txtRecord['pri'], 100, service.txtRecord, 0));
                this.log(`Query service is up: ${service.name} @ ${service.txtRecord['api_proto']}://${service.addresses[0]}:${service.port} (${service.txtRecord['api_ver']})`);
     
                if (!(this._query instanceof Query)) {
                    // a new query service came online, try to use it

                    clearTimeout(reactionTimeout);
                    reactionTimeout = setTimeout(async () => {
                        if (this._query || registering)
                            return;
                        registering = true;

                        let gracePeriod = Math.floor(Math.random() * 500);
                        await this.sleep(gracePeriod);
                        
                        this.log(`P2P: Attempting to switch to centralized query API`);
                        this._query = null;
                        await this.getService();
                    }, 1000);
                }
            }
        });

        this._queryServiceBrowser.on('serviceDown', async service => {
            if (!this._multicastQueryServices.some(x => x.name === service.name))
                return;
            
            this.log(`Registry is down: ${service.name}`);

            this._multicastQueryServices = this._multicastQueryServices.filter(x => x.name !== service.name);
            this._queryServices = this._queryServices.filter(x => x.name !== service.name);

            if (this._query instanceof Query && this._query.service.name === service.name) {
                // uh oh, our query service just went down
                this.logError(`Query service ${this._query.url} reports it is going down, choosing a new one`);

                // Try to scan for new registry instances
                
                this._query = await this.getService();
            }
        });

        this._queryServiceBrowser.start();


        this._nodeBrowser = mdns.createBrowser(mdns.tcp('nmos-node'));
        this._nodeBrowser.on('serviceUp', async service => {
            await this.handleMulticastAnnounce(service);
        });

        this._nodeBrowser.on('serviceDown', srv => {
            this._nodeStates = this._nodeStates.filter(x => x.service.name !== srv.name);
        });

        this.log(`Searching for nodes...`);
        this._nodeBrowser.start();

        await this.sleep(2000);
    }

    private async createOrUpdateAllResources(nodeState : NodeState) {
        nodeState.node = await nodeState.client.self('v1.3');

        this.createOrUpdateAllResourcesOfType(nodeState, 'devices', await nodeState.client.devices(nodeState.version));
        this.createOrUpdateAllResourcesOfType(nodeState, 'sources', await nodeState.client.sources(nodeState.version));
        this.createOrUpdateAllResourcesOfType(nodeState, 'flows', await nodeState.client.flows(nodeState.version));
        this.createOrUpdateAllResourcesOfType(nodeState, 'senders', await nodeState.client.senders(nodeState.version));
        this.createOrUpdateAllResourcesOfType(nodeState, 'receivers', await nodeState.client.receivers(nodeState.version));
    }

    private createOrUpdateAllResourcesOfType(node : NodeState, type : string, fetchedItems : ResourceCore[]) {
        let items = (<ResourceCore[]>node[type]).slice() || [];
        
        for (let item of fetchedItems) {
            let existing = items.find(x => x.id === item.id);
            if (existing)
                Object.assign(existing, item);
            else
                items.push(item);
        }
        
        node[type] = items;
    }

    private async createOrUpdateResourceOfType(nodeState : NodeState, type : string, id : string) {
        // TODO
    }

    private async handleNodeUpdate(announcement : Service, node : NodeState) {
        if (node.lastUpdated && node.lastUpdated + 10*1000 > Date.now())
            return;

        node.lastUpdated = Date.now();
        
        if (node.service === null) {
            await this.createOrUpdateAllResources(node);
        } else {
            this.log(`Node '${node.id}' updated`);
            // Updated (TODO)
        }

        node.service = announcement;
    }

    private _nodeBrowser : mdns.Browser;
    private _nodeStates : NodeState[] = [];

    get nodes() : Node[] {
        return this._nodeStates.map(x => x.node);
    }

    get flows() : Flow[] {
        return [].concat(...this._nodeStates.map(x => x.flows));
    }

    get sources() : Source[] {
        return [].concat(...this._nodeStates.map(x => x.sources));
    }

    get devices() : Device[] {
        return [].concat(...this._nodeStates.map(x => x.devices));
    }

    get senders() : Sender[] {
        return [].concat(...this._nodeStates.map(x => x.senders));
    }

    get receivers() : Receiver[] {
        return [].concat(...this._nodeStates.map(x => x.receivers));
    }

    get nodeStates() : NodeState[] {
        return this._nodeStates;
    }

    private async findAcceptableQueryService(): Promise<QueryInterface> {
        this._queryServices = await this.queryForQueryServices();

        // this.log(`Selecting from ${this._queryServices.length} available query services:`);f
        // for (let item of this._queryServices) {
        //     this.log(` - [${item.ignored ? 'ignored' : 'ready'}] ${item.name}: ${item.hostname}:${item.port}, pri=${item.priority}, weight=${item.weight}, meta=${JSON.stringify(item.metadata)}`);
        // }

        if (this._queryServices.length > 0)
            return new Query(await Service.select(this._queryServices));
        else if (this.allowMulticast)
            return new DynamicQuery(this);
    }

    async getService() {
        if (this._query)
            return this._query;

        this._query = await this.findAcceptableQueryService();

        // If we couldn't obtain a registry with our current set, try again 
        // with refresh 

        if (!this._query)
            this._query = await this.findAcceptableQueryService();

        if (this._query instanceof Query && this._query) {
            this.log(`Selected query service ${this._query.url}`);
        } else if (this._query) {
            this.log(`Selected P2P query service`);
        }
        
        return this._query;
    }


}