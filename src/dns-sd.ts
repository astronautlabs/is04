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
        readonly name : string,
        readonly hostname : string,
        readonly port : number,
        readonly priority : number,
        readonly weight : number,
        readonly metadata : Record<string,string>,
        readonly expiresAt : number
    ) {
    }

    static fromMulticast(service : mdns.Service) {
        return new Service(
            service.name,
            service.addresses[0], 
            service.port, 
            Number(service.txtRecord['pri']) || 0, 
            100, 
            service.txtRecord,
            Date.now() + 10*1000 // TODO
        );
    }

    static fromUnicast(hostname : string, srvRecord : dns.AnySrvRecord, metadata : Record<string,string>) {
        return new Service(
            hostname,
            srvRecord.name, 
            srvRecord.port, 
            srvRecord.priority, 
            srvRecord.weight, 
            metadata, 
            Date.now() + 10*1000 // TODO
        );
    }

    get expired() {
        return Date.now() > this.expiresAt;
    }

    get ignored() {
        return Date.now() < this.ignoredUntil;
    }

    ignore(reason: string, timeout = 1000*60) {
        //console.log(`[DNS-SD] Ignoring service ${this.hostname} / ${this.port}: reason=${reason}`);
        this.ignoredUntil = Date.now() + timeout;
    }

    ignoredUntil : number = 0;

    getProperty(name : string): string {
        let casedKey = Object.keys(this.metadata).find(x => x.toLowerCase() === name.toLowerCase());
        return this.metadata[casedKey];
    }

    /**
     * Select a service out of the available service instances based on the 
     * relevant priorities and weights specified by the service advertisements
     * @param services 
     */
    static async select(services : Service[]): Promise<Service>;
    static async select<T>(services : Service[], selector : (service : Service) => Promise<T>): Promise<T>;
    static async select(services : Service[], selector? : (service : Service) => any) {
        if (services.length === 0)
            return null;
        
        tryAgain: do {
            let now = Date.now();
            let viableServers = services.filter(x => x.ignoredUntil < now);

            let candidate = viableServers[0];
            if (!candidate) {
                return null;
            }

            let candidates = viableServers.filter(x => x.priority === candidate.priority).sort((a, b) => a.weight - b.weight);
            let sumOfWeights = candidates.map(c => c.weight).reduce((pv, cv) => pv + cv, 0);
            let target = Math.random()*sumOfWeights;
            let x = 0;

            for (let candidate of candidates) {
                if (target >= x && target <= x + candidate.weight) {
                    if (selector) {
                        try {
                            return await selector(candidate);
                        } catch (e) {
                            if (!candidate.ignored)
                                candidate.ignore(`Failed acceptance: ${e.message}`)
                            continue tryAgain;
                        }
                    }

                    return candidate;
                }
                x += candidate.weight;
            }

            break;
        } while (true);
    }

    static async browseMulticast(serviceName : string, protocol : 'tcp' | 'udp', waitTime = 1000 * 10, knownServices : Service[] = []) {
        return await new Promise<Service[]>((resolve, reject) => {
            console.log(`[DNS-SD] Multicast: Finding service _${serviceName}._${protocol}... (${knownServices.length} known services already)`);
            let browser = mdns.createBrowser(protocol === 'tcp' ? mdns.tcp(serviceName) : mdns.udp(serviceName));
            let services : Service[] = knownServices.slice();
            let finishedTimeout = setTimeout(() => finish(), waitTime);

            function finish() {
                browser.stop();
                console.log(`[DNS-SD] Multicast: _${serviceName}._${protocol}: Returning ${services.length} candidates`);
                resolve(services);
            }

            browser.on('serviceUp', service => {
                if (!services.some(x => x.hostname === service.addresses[0] && x.port === service.port)) {
                    console.log(`[DNS-SD] Multicast: _${serviceName}._${protocol}: Found ${service.addresses[0]}:${service.port} with meta ${JSON.stringify(service.txtRecord)}`);    
                    services.push(Service.fromMulticast(service));
                }
                
                clearTimeout(finishedTimeout);
                finishedTimeout = setTimeout(() => finish(), waitTime);
            });

            browser.start();
            
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

        return Service.fromUnicast(hostname, srvRecord, metadata);
    }
}
