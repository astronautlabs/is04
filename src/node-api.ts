import { Controller, Get } from '@alterior/web-server';
import { Device, Flow, Node, Receiver, Sender, Source } from './schema';
import { Service } from './dns-sd';
import { Registry } from './registry';
import type * as express from 'express';
import { RegistryService } from './registry.service';

const PREFIX = '/x-nmos/node/:v';

@Controller('', {})
export class NodeApi {
    constructor(private registryService : RegistryService) {
        this.registryService.nodeApi = this;
    }
    @Get(`/x-nmos`) nmos() { return [ 'node/' ]; }
    @Get(`/x-nmos/node`) nodeVersions() { return [ 'v1.3/' ]; }
    @Get(`/x-nmos/node/:v`) root() { return [ 'self/', 'sources/', 'flows/', 'devices/', 'senders/', 'receivers/' ]; }
    @Get(`/x-nmos/node/:v/self`) self(): Node { return this.registryService.node; }
    @Get(`/x-nmos/node/:v/sources`) sources(): Source[] { return this.registryService.sources; }
    @Get(`/x-nmos/node/:v/flows`) flows(): Flow[] { return this.registryService.flows; }
    @Get(`/x-nmos/node/:v/devices`) devices(): Device[] { return this.registryService.devices; }
    @Get(`/x-nmos/node/:v/senders`) senders(): Sender[] { return this.registryService.senders; }
    @Get(`/x-nmos/node/:v/receivers`) receivers(): Receiver[] { return this.registryService.receivers; }
}