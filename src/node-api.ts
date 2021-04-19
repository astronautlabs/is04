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
    @Get(`/x-nmos`) async nmos() { return [ 'node/' ]; }
    @Get(`/x-nmos/node`) nodeVersions() { return [ 'v1.3/' ]; }
    @Get(`/x-nmos/node/:v`) root(v : string) { return [ 'self/', 'sources/', 'flows/', 'devices/', 'senders/', 'receivers/' ]; }
    @Get(`/x-nmos/node/:v/self`) self(v : string): Node { return this.registryService.node; }
    @Get(`/x-nmos/node/:v/sources`) sources(v : string): Source[] { return this.registryService.sources; }
    @Get(`/x-nmos/node/:v/flows`) flows(v : string): Flow[] { return this.registryService.flows; }
    @Get(`/x-nmos/node/:v/devices`) devices(v : string): Device[] { return this.registryService.devices; }
    @Get(`/x-nmos/node/:v/senders`) senders(v : string): Sender[] { return this.registryService.senders; }
    @Get(`/x-nmos/node/:v/receivers`) receivers(v : string): Receiver[] { return this.registryService.receivers; }
}