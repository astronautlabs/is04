import "zone.js";
import "reflect-metadata";
import "source-map-support/register";
import { Application } from "@alterior/runtime";
import { Mount, WebServer, WebService } from "@alterior/web-server";
import { NodeApi, Error, IS04Module } from "..";
import type * as express from 'express';
import { QueryService } from "../dist/query.service";
import * as os from 'os';
import { QueryApi } from "../dist/query-api";

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
        port: 3124,
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
        private query : QueryService
    ) {
    }
    
    async altOnInit() {
        let service = await this.query.getService();

        //service.queryNodes()
    }

    @Mount() queryApi : QueryApi;
}

async function main() {
    Application.bootstrap(MyService);
}

main();