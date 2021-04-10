import { Service } from "./dns-sd";
import { Device, Flow, Node, Receiver, RegistrationApiHealthResponse, RegistrationApiResourcePostRequest, ResourceCore, Sender, Source } from "./schema";
import fetch from 'node-fetch';

export interface RegistrationResult<T> {
    status : 'registered' | 'already-registered';
    location : string;
    type : string;
    resource : T;
}

export class Registry {
    constructor(readonly service : Service) {
    }

    get url() {
        return `${this.service.getProperty('api_proto')}://${this.service.hostname}:${this.service.port}`;
    }

    async get(type : 'nodes', id : string): Promise<Node>;
    async get(type : 'devices', id : string): Promise<Device>;
    async get(type : 'sources', id : string): Promise<Source>;
    async get(type : 'flows', id : string): Promise<Flow>;
    async get(type : 'senders', id : string): Promise<Sender>;
    async get(type : 'receivers', id : string): Promise<Receiver>;
    async get<T = any>(type : string, id : string): Promise<T> {
        let response = await fetch(`${this.url}/resource/${type}/${id}`);
        if (response.status === 404)
            return null;

        let body = await response.json();

        if (response.status >= 400)
            throw new Error(`Failed to retrieve resource of type ${type} with ID ${id}: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);
    }

    async delete(type : 'nodes' | 'devices' | 'sources' | 'flows' | 'senders' | 'receivers', id : string): Promise<void> {
        let response = await fetch(`${this.url}/resource/${type}/${id}`);
        let body = await response.json();
        if (response.status >= 400)
            throw new Error(`Failed to delete resource of type ${type} with ID ${id}: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);
    }

    async register(type : 'node', resource : Node): Promise<RegistrationResult<Node>>;
    async register(type : 'device', resource : Device): Promise<RegistrationResult<Device>>;
    async register(type : 'source', resource : Source): Promise<RegistrationResult<Source>>;
    async register(type : 'flow', resource : Flow): Promise<RegistrationResult<Flow>>;
    async register(type : 'sender', resource : Sender): Promise<RegistrationResult<Sender>>;
    async register(type : 'receiver', resource : Receiver): Promise<RegistrationResult<Receiver>>;
    async register(type : string, resource : any): Promise<RegistrationResult<any>>;
    async register<T extends ResourceCore>(type : string, resource : T): Promise<RegistrationResult<T>> {
        let response = await fetch(`${this.url}/resource`, {
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(<RegistrationApiResourcePostRequest>{ type, resource })
        });

        let body = await response.json();

        if (response.status >= 400)
            throw new Error(`Failed to register resource of type ${type} with ID ${resource.id}: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);
        
        return {
            status: response.status === 200 ? 'already-registered' : 'registered',
            location: response.headers.get('Location'),
            type,
            resource: body
        }
    }

    async heartbeat(id : string): Promise<RegistrationApiHealthResponse> {
        let response = await fetch(`${this.url}/health/nodes/${id}`, {
            method: 'post',
            headers: { 'Content-Type': 'application/json' } 
        });

        let body = await response.json();

        if (response.status >= 400)
            throw new Error(`Failed to send heartbeat for resource ID ${id}: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);
        
        return body;
    }

    async getHealth(id : string): Promise<RegistrationApiHealthResponse> {
        let response = await fetch(`${this.url}/health/nodes/${id}`, {
            method: 'get',
            headers: { 'Content-Type': 'application/json' } 
        });

        let body = await response.json();

        if (response.status >= 400)
            throw new Error(`Failed to get health for resource ID ${id}: ${response.status} ${response.statusText}. Response: ${JSON.stringify(body)}`);
        
        return body;
    }

    static async locate(domain? : string): Promise<Service[]> {
        let services : Service[] = [];
        
        if (domain)
            services = await Service.browseUnicast('nmos-register', 'tcp', domain);

        if (services.length === 0)
            services = await Service.browseMulticast('nmos-register', 'tcp');

        return services;
    }
}