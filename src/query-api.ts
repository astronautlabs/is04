import { Controller, Get } from '@alterior/web-server';
import { Device, Flow, Node, Receiver, Sender, Source } from './schema';
import { Service } from './dns-sd';
import { Registry } from './registry';
import type * as express from 'express';
import { RegistryService } from './registry.service';
import { QueryService } from './query.service';

const PREFIX = '/x-nmos/query/:v';

@Controller('', {})
export class QueryApi {
    constructor(private queryService : QueryService) {
        this.queryService.queryApi = this;
    }
    @Get(`/x-nmos`) nmos() { return [ 'query/' ]; }
    @Get(`/x-nmos/query`) base() { return [ 'subscriptions/', 'flows/', 'sources/', 'nodes/', 'devices/', 'senders/', 'receivers/' ]; }
    @Get(`/x-nmos/query/nodes`) 
    async nodes() { 
        let query = await this.queryService.getService();
        return await query.queryNodes();
    }

    @Get(`/x-nmos/query/devices`) 
    async devices() { 
        let query = await this.queryService.getService();
        return await query.queryDevices();
    }

    @Get(`/x-nmos/query/sources`) 
    async sources() { 
        let query = await this.queryService.getService();
        return await query.querySources();
    }

    @Get(`/x-nmos/query/flows`) 
    async flows() { 
        let query = await this.queryService.getService();
        return await query.queryFlows();
    }

    @Get(`/x-nmos/query/senders`) 
    async senders() { 
        let query = await this.queryService.getService();
        return await query.querySenders();
    }

    @Get(`/x-nmos/query/receivers`) 
    async receivers() { 
        let query = await this.queryService.getService();
        return await query.queryReceivers();
    }
}