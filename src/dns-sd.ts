import * as dns from 'dns';
import * as mdns from 'mdns';

async function getPtrRecords(domain : string): Promise<string[]> {
    return new Promise<string[]>((res, rej) => dns.resolvePtr(domain, (e, addr) => e ? rej(e) : res(addr)));
}

async function getAnyRecords(domain : string): Promise<dns.AnyRecord[]> {
    return new Promise<dns.AnyRecord[]>((res, rej) => {
        dns.resolveAny(domain, (err, records) => err ? rej(err) : res(records));
    });
}

export class Service {
    constructor(
        readonly hostname : string,
        readonly port : number,
        readonly priority : number,
        readonly weight : number,
        readonly metadata : Record<string,string>
    ) {
    }

    ignore(timeout = 1000*60) {
        this.ignoredUntil = Date.now() + timeout;
    }

    ignoredUntil : number;

    getProperty(name : string): string {
        let casedKey = Object.keys(this.metadata).find(x => x.toLowerCase() === name.toLowerCase());
        return this.metadata[casedKey];
    }

    /**
     * Select a service out of the available service instances based on the 
     * relevant priorities and weights specified by the service advertisements
     * @param services 
     */
    static select(services : Service[]): Service {
        if (services.length === 0)
            return null;
            
        let now = Date.now();
        let viableServers = services.filter(x => x.ignoredUntil < now);
        let candidate = viableServers[0];
        if (!candidate)
            return null;
        let candidates = viableServers.filter(x => x.priority === candidate.priority).sort((a, b) => a.weight - b.weight);
        let sumOfWeights = candidates.map(c => c.weight).reduce((pv, cv) => pv + cv, 0);
        let target = Math.random()*sumOfWeights;
        let x = 0;
        for (let candidate of candidates) {
            if (target <= x)
                return candidate;
            x += candidate.weight;
        }
    }

    static async browseMulticast(serviceName : string, protocol : 'tcp' | 'udp', waitTime = 1000 * 10) {
        return new Promise<Service[]>((resolve, reject) => {
            let browser = mdns.createBrowser(protocol === 'tcp' ? mdns.tcp(serviceName) : mdns.udp(serviceName));
            let services : Service[] = [];
            browser.on('serviceUp', service => {
                services.push(new Service(service.addresses[0], service.port, Number(service.txtRecord['pri']) || 0, 100, service.txtRecord));
            });

            browser.start();
            setTimeout(() => {
                browser.stop();
                resolve(services);
            }, waitTime);
        });
    }
    
    static async browseUnicast(serviceName : string, protocol : 'tcp' | 'udp', searchDomain : string) {
        return await getPtrRecords(`_${serviceName}._${protocol}.${searchDomain}`)
            .then(serviceHosts => Promise.all(serviceHosts.map(serviceHost => this.resolveUnicast(serviceHost))))
    }

    private static async resolveUnicast(hostname : string) {
        let records = await getAnyRecords(hostname);
        let srvRecord = <dns.AnySrvRecord>records.find(x => x.type === 'SRV');
        let txtRecord = <dns.AnyTxtRecord>records.find(x => x.type === 'TXT');

        let metadata : Record<string,string> = {};

        if (txtRecord) {
            for (let entry of txtRecord.entries) {
                let equalsIndex = entry.indexOf('=');

                if (equalsIndex < 0) {
                    metadata[entry] = '1';
                    continue;
                }

                let key = entry.substr(0, equalsIndex);
                let value = entry.substr(equalsIndex + 1);
                if (key in metadata)
                    continue;
                
                metadata[key] = value;
            }
        }

        return new Service(srvRecord.name, srvRecord.port, srvRecord.priority, srvRecord.weight, metadata);
    }
}
