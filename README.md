# @/is04

[![npm](https://img.shields.io/npm/v/@astronautlabs/is04)](https://npmjs.com/package/@astronautlabs/is04)
[![CircleCI](https://circleci.com/gh/astronautlabs/is04.svg?style=svg)](https://circleci.com/gh/astronautlabs/is04)

> **[📜 NMOS IS-04](https://specs.amwa.tv/is-04/)**  
> AMWA IS-04 NMOS Discovery and Registration Specification (Stable)

> 📺 Part of the **Astronaut Labs Broadcast Suite**  
> [@/is04](https://github.com/astronautlabs/is04) |
> [@/is05](https://github.com/astronautlabs/is05) |
> [@/rfc8331](https://github.com/astronautlabs/rfc8331) |
> [@/rtp](https://github.com/astronautlabs/rtp) |
> [@/scte104](https://github.com/astronautlabs/scte104) | 
> [@/scte35](https://github.com/astronautlabs/scte35) | 
> [@/st2010](https://github.com/astronautlabs/st2010) | 
> [@/st291](https://github.com/astronautlabs/st291)

> ⚠ **Alpha Quality**  
> This library is still in development and is subject to change

---

Implementation of AMWA's NMOS IS-04 standard for Discovery and Registration. Currently covers the Node API and related
functionality of the standard (ability to implement a Node, ability to register and query such a Node). 

Passes the IS-04 suites of the [NMOS Test](https://github.com/AMWA-TV/nmos-testing) tool.

# Usage

```
npm install @astronautlabs/is04
```

Then add NodeService to your app:
```typescript
import { WebService } from "@alterior/web-server";

@WebService()
class MyService {
    @Mount() nodeService : NodeService;

    async altOnInit() {
        this.nodeService.node = {
            "version": "1441700172:318426300",
            "hostname": "host1",
            "href": "http://172.29.80.65:12345/",
            "caps": {},
            // ...
        };

        await this.nodeService.addDevice({ /* ... */ });
        await this.nodeService.addSource({ /* ... */ });
        await this.nodeService.addSender({ /* ... */ });
        await this.nodeService.addReceiver({ /* ... */ });

        // Once all your initial resources are added, call .register
        // to find the registration service and register
        await this.nodeService.register();

        // After registering, you can continue adding resources
        // and they will be automatically registered with the 
        // registry

        await this.nodeService.addReceiver({ /* ... */ });
    }
}
```

## Add CORS

To be spec-compliant, you must implement CORS for this API. You should attach a middleware that handles CORS to your requirements. The following example opens CORS broadly, though this may not be suitable for a production deployment.

```typescript
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
    server: [
        middleware: [ CORS ]
    ]
})
class MyService {
    nodeService : NodeService;
}
```

## Handle 404s appropriately

The default 404 error handler from Alterior is insufficient to pass the NMOS test suite, because errors must use the `Error` schema from IS-04.