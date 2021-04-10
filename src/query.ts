import { Service } from "./dns-sd";
import { Device, Flow, Receiver, Sender, Source } from "./schema";
import { formEncode } from "./utils";

export class Query {
    constructor(readonly service : Service) {
    }

    get url() {
        return `${this.service.getProperty('api_proto')}://${this.service.hostname}:${this.service.port}`;
    }

    async query(type : string, params : any) {
        let response = await fetch(`${this.url}/${type}?${formEncode(params)}`);
        let body = await response.json();
        if (response.status >= 400)
            throw new Error(`Failed to query for ${type}: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);

        return body;
    }

    async queryNodes     (options? : any) : Promise<Node[]>     { return await this.query('nodes',     options); }
    async querySources   (options? : any) : Promise<Source[]>   { return await this.query('sources',   options); }
    async queryFlows     (options? : any) : Promise<Flow[]>     { return await this.query('flows',     options); }
    async queryDevices   (options? : any) : Promise<Device[]>   { return await this.query('devices',   options); }
    async querySenders   (options? : any) : Promise<Sender[]>   { return await this.query('devices',   options); }
    async queryReceivers (options? : any) : Promise<Receiver[]> { return await this.query('receivers', options); }

    async getNode(id : string): Promise<Node> {
        let response = await fetch(`${this.url}/nodes/${id}`);
        let body = await response.json();

        if (response.status >= 400)
            throw new Error(`Failed to query for node: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);

        return body;
    }

    async getSource(id : string): Promise<Source> {
        let response = await fetch(`${this.url}/sources/${id}`);
        let body = await response.json();

        if (response.status >= 400)
            throw new Error(`Failed to query for source: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);

        return body;
    }

    async getFlow(id : string): Promise<Flow> {
        let response = await fetch(`${this.url}/flows/${id}`);
        let body = await response.json();

        if (response.status >= 400)
            throw new Error(`Failed to query for flow: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);

        return body;
    }

    async getDevice(id : string): Promise<Device> {
        let response = await fetch(`${this.url}/devices/${id}`);
        let body = await response.json();

        if (response.status >= 400)
            throw new Error(`Failed to query for flow: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);

        return body;
    }

    async getSender(id : string): Promise<Sender> {
        let response = await fetch(`${this.url}/senders/${id}`);
        let body = await response.json();

        if (response.status >= 400)
            throw new Error(`Failed to query for flow: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);

        return body;
    }

    async getReceiver(id : string): Promise<Receiver> {
        let response = await fetch(`${this.url}/receivers/${id}`);
        let body = await response.json();

        if (response.status >= 400)
            throw new Error(`Failed to query for flow: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);

        return body;
    }

    static async locate(domain? : string): Promise<Service[]> {
        let services : Service[] = [];
        
        if (domain)
            services = await Service.browseUnicast('nmos-query', 'tcp', domain);

        if (services.length === 0)
            services = await Service.browseMulticast('nmos-query', 'tcp');

        return services;
    }
}