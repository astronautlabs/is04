import "zone.js";
import "reflect-metadata";
import "source-map-support/register";
import { Application } from "@alterior/runtime";
import { Mount, WebServer, WebService } from "@alterior/web-server";
import { NodeApi, Error, IS04Module } from "..";
import type * as express from 'express';
import { RegistryService } from "../dist/registry.service";
import * as os from 'os';

function CORS(req : express.Request, res : express.Response, next : Function) {
    res
        .header('Access-Control-Allow-Origin', req.header('origin') || '*')
        .header('Access-Control-Allow-Methods', 'GET, PUT, POST, PATCH, HEAD, OPTIONS, DELETE')
        .header('Access-Control-Allow-Headers', 'Content-Type, Accept')
        .header('Access-Control-Max-Age', '3600')
    ;
    next();
}

@WebService({
    server: {
        port: 3123,
        middleware: [ CORS ],
        defaultHandler: ev => {
            ev.response.status(404).json(<Error>{
                code: 404,
                debug: 'not-found',
                error: 'The resource was not found'
            });
        }
    },
    imports: [ IS04Module ]
})
class MyService {
    constructor(
        private registry : RegistryService
    ) {
    }

    @Mount()
    nodeApi : NodeApi;

    async altOnInit() {
        await this.registry.init();
        
        this.registry.node.label = 'Test Node';
        this.registry.node.description = 'This is a test node';
        
        this.registry.node.services = [
            {
                "href": `https://${os.hostname}:${WebServer.for(this).options.port}/x-astronautlabs/splicepoint/`,
                "authorization": false,
                "type": "urn:x-astronautlabs:service:splicepoint"
            }
        ];

        this.registry.node.clocks.push({
            name: "clk1",
            ref_type:"ptp",
            traceable: true,
            version: "IEEE1588-2008",
            gmid: "08-00-11-ff-fe-21-e1-b0",
            locked: true
        });

        await this.registry.register();
    }
}

async function main() {
    Application.bootstrap(MyService);
}

main();