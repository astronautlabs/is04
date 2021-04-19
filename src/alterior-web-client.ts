import { Constructor } from "@alterior/runtime";
import { InputAnnotation, RouteDefinition } from "@alterior/web-server";
import { Annotations } from "@alterior/annotations";

const getParameterNames = require('@avejidah/get-parameter-names');

export interface ClientOptions { 
}

export class RestClientError extends Error {
    constructor(message : string, readonly response : Response) {
        super(message);
    }
}

export type RestClient<T> = {
    [P in keyof T as T[P] extends ((...args) => any) ? P : never]: 
        T[P] extends ((...args) => any) 
            ? (...args : Parameters<T[P]>) => (
                ReturnType<T[P]> extends Promise<any> 
                    ? ReturnType<T[P]> 
                    : Promise<ReturnType<T[P]>>
            )
            : never
    ;
};

export interface RestClientConstructor<T> {
    new (endpoint : string, options? : ClientOptions) : RestClient<T>;
}

export function clientClassFor<T>(klass : Constructor<T>): RestClientConstructor<RestClient<T>> {
    function ctor(endpoint : string, options? : ClientOptions) {
        let routes : RouteDefinition[] = klass.prototype['alterior:routes'] || [];
        let routeMap = new Map<string, RouteDefinition>();
        for (let route of routes)
            routeMap.set(route.method, route);

        return new Proxy({}, {
            get(target, prop, receiver) {
                if (typeof prop === 'symbol' || typeof prop === 'number') 
                    return undefined; 
                let route = routeMap.get(prop);
                if (!route) 
                    return undefined;

                let fetchp : typeof fetch;

                if (typeof fetch !== 'undefined') {
                    fetchp = fetch;
                } else {
                    if (typeof require !== 'undefined') {
                        try {
                            fetchp = require('node-fetch');
                        } catch (e) {
                            console.error(`Failed to load node-fetch:`);
                            console.error(e);
                        }
                    }
                }

                if (!fetchp)
                    throw new Error(`No fetch() implementation available`);

                let returnType = Reflect.getMetadata('design:returntype', klass.prototype, route.method);
                let paramTypes = Reflect.getMetadata('design:paramtypes', klass.prototype, route.method);
                let paramNames : string[] = getParameterNames(klass.prototype[route.method]);
                let paramAnnotations = Annotations.getParameterAnnotations(klass, route.method, false);
        		let pathParamNames = Object.keys(
                    (route.path.match(/:([A-Za-z0-9]+)/g) || [])
                        .reduce((pv, cv) => (pv[cv] = 1, pv), {})
                );

                let paramFactories = paramNames.map((paramName, i) => {
                    let annots = paramAnnotations[i] || [];
                    let inputAnnot = <InputAnnotation>annots.find(x => x instanceof InputAnnotation);

                    return (request : RequestInit, path : Record<string,string>, query : Record<string,string>, value : any) => {
                        let isBody = false;

                        if (inputAnnot) {
                            if (inputAnnot.type === 'body') {
                                isBody = true;
                            } else if (inputAnnot.type === 'path') {
                                path[inputAnnot.name || paramName] = value;
                            } else if (inputAnnot.type === 'query') {
                                query[inputAnnot.name || paramName] = value;
                            } 
                        } else {
                            if (paramName === 'body') {
                                isBody = true;
                            } else {
                                if (pathParamNames.includes(`:${paramName}`)) {
                                    path[paramName] = value;
                                }
                            }
                        }

                        if (isBody) {
                            request.headers['Content-Type'] = 'application/json';
                            request.body = JSON.stringify(value); // TODO: handle other body types
                        }
                    }
                });

                let pathVars = route.path.match(/:[^:/]/g);
                let pathChunks : string[] = [];
                let unconsumedPath = route.path;
                for (let pathVar of pathVars) {
                    let index = unconsumedPath.indexOf(pathVar);
                    let before = unconsumedPath.slice(0, index);

                    if (before)
                        pathChunks.push(before);
                       
                    pathChunks.push(pathVar);
                    unconsumedPath = unconsumedPath.slice(index + pathVar.length);
                }

                if (unconsumedPath)
                    pathChunks.push(unconsumedPath);

        		// Construct a set of easily addressable path parameter descriptions (pathParameterMap)
        		// that can be decorated with insights from reflection later.

                return async (...args : any[]) => {
                    let init : RequestInit = {
                        method: route.httpMethod,
                        headers: []
                    };
                    let path : Record<string,string> = {};
                    let query : Record<string,string> = {};

                    for (let i = 0, max = args.length; i < max; ++i)
                        paramFactories[i](init, path, query, args[i]);

                    let url = endpoint;

                    for (let chunk of pathChunks) {
                        url += chunk.startsWith(':') ? String(path[chunk.slice(1)] || '') : chunk;
                    }

                    let queryString = Object.keys(query)
                        .filter(k => query[k] !== undefined)
                        .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(query[k])}`)
                        .join('&');

                    if (queryString !== '')
                        url = `${url}?${queryString}`;

                    let response = await fetchp(url, init);

                    if (response.status >= 400)
                        throw new RestClientError(`${response.status} ${response.statusText}`, response);
                    
                    // TODO: more exotic response body types
                    return await response.json();
                };
            }
        });
    }

    return <any>ctor;
};

export function clientFor<T>(klass : Constructor<T>, endpoint : string, options? : ClientOptions) {
    return new (clientClassFor(klass))(endpoint, options);
};