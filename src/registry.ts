import { Service } from "./dns-sd";
import { Device, Flow, Node, Receiver, RegistrationApiHealthResponse, RegistrationApiResourcePostRequest, ResourceCore, Sender, Source } from "./schema";
import fetch from 'node-fetch';
import AbortController from 'abort-controller';

export interface RegistrationResult<T> {
    status : 'registered' | 'already-registered';
    location : string;
    type : string;
    resource : T;
}

export class Registry {
    private constructor(readonly service : Service) {
    }

    get version() {
        return this.service.getProperty('api_ver');
    }

    get url() {
        return `${this.service.getProperty('api_proto')}://${this.service.hostname}:${this.service.port}/x-nmos/registration/${this.version}`;
    }

    static async accept(svc : Service): Promise<Registry> {
        let url = `${svc.getProperty('api_proto')}://${svc.hostname}:${svc.port}/x-nmos/registration/${svc.getProperty('api_ver')}`;
        let apiVersion = svc.getProperty('api_ver');
        let [majorTxt, minorTxt] = apiVersion.replace(/^v/, '').split('.');
        let major = Number(majorTxt), minor = Number(minorTxt);

        try {
            if (!['http', 'https'].includes(svc.getProperty('api_proto')))
                throw new Error(`Service must use http or https, not ${svc.getProperty('api_proto')}`);

            if (major > 1)
                throw new Error(`Service has version ${apiVersion}, this client only supports v1.x`);

            // Try to connect to it to be sure it's working 
            // let response = await fetch(url, { timeout: 2000 });
            // if (response.status >= 400) {
            //     let text = await response.text();
            //     throw new Error(`Could not contact registration API found at ${url}: ${response.status} ${response.statusText}, body was '${text}'`);
            // }

            return new Registry(svc);
        } catch (e) {
            console.error(`[NMOS IS-04] ERROR :: Registration service ${url} (${apiVersion}) was not acceptable: ${e.message}`);
            throw e;
        }
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
        let response = await fetch(`${this.url}/resource/${type}/${id}`, { method: 'delete' });
        if (response.status >= 400)
            throw new Error(`Failed to delete resource of type ${type} with ID ${id}: ${response.status} ${response.statusText}`);
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
            method: 'POST',
            timeout: 5000,
            body: JSON.stringify(<RegistrationApiResourcePostRequest>{ type, data: <any>resource })
        });

        if (response.status >= 500) {
            throw new Error(`Server error: Failed to register ${type}/${resource.id}: ${response.status} ${response.statusText}`);
        } else if (response.status >= 400) {
            let bodyText = await response.text();
            throw new Error(`Client error: Failed to register ${type}/${resource.id}: ${response.status} ${response.statusText}. Body: '${bodyText}'`);
        }

        let body = await response.json();

        return {
            status: response.status === 200 ? 'already-registered' : 'registered',
            location: response.headers.get('Location'),
            type,
            resource: body
        }
    }

    async heartbeat(id : string, timeout : number): Promise<RegistrationApiHealthResponse> {
        let controller = new AbortController();
        let timeoutHandle = setTimeout(() => controller.abort(), timeout);
        let response = await fetch(`${this.url}/health/nodes/${id}`, {
            method: 'post',
            signal: controller.signal,
            headers: { 'Content-Type': 'application/json' } 
        });

        clearTimeout(timeoutHandle);

        let bodyText = await response.text();
        let body;

        try {
            body = JSON.parse(bodyText);
        } catch (e) {
            console.warn(`[NMOS IS-04] ERROR: Failed to parse heartbeat response from registry (${response.status} ${response.statusText}): ${e.message}`);
            throw e;
        }

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
}