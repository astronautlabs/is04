import { ResourceCore } from "./ResourceCore";
import { ClockInternal } from "./ClockInternal";
import { ClockPtp } from "./ClockPtp";
/**
 * Describes the Node and the services which run on it
 */
export type Node = ResourceCore & {
    
    /**
     * HTTP access href for the Node's API (deprecated)
     */
    href : string,
    
    /**
     * Node hostname (optional, deprecated)
     */
    hostname? : string,
    
    /**
     * URL fragments required to connect to the Node API
     */
    api : {
        
        /**
         * Supported API versions running on this Node
         */
        versions : Array<string>,
        
        /**
         * Host, port and protocol details required to connect to the API
         */
        endpoints : Array<{
            
            /**
             * IP address or hostname which the Node API is running on
             */
            host : string,
            
            /**
             * Port number which the Node API is running on
             */
            port : number,
            
            /**
             * Protocol supported by this instance of the Node API
             */
            protocol : string,
            
            /**
             * This endpoint requires authorization
             */
            authorization? : boolean
        }>
    },
    
    /**
     * Capabilities (not yet defined)
     */
    caps : {
        
    },
    
    /**
     * Array of objects containing a URN format type and href
     */
    services : Array<{
        
        /**
         * URL to reach a service running on the Node
         */
        href : string,
        
        /**
         * URN identifying the type of service
         */
        type : string,
        
        /**
         * This endpoint requires authorization
         */
        authorization? : boolean
    }>,
    
    /**
     * Clocks made available to Devices owned by this Node
     */
    clocks : Array<ClockInternal | ClockPtp>,
    
    /**
     * Network interfaces made available to devices owned by this Node. Port IDs and Chassis IDs are used to inform topology discovery via IS-06, and require that interfaces implement ARP at a minimum, and ideally LLDP.
     */
    interfaces : Array<{
        
        /**
         * Chassis ID of the interface, as signalled in LLDP from this node. Set to null where LLDP is unsuitable for use (ie. virtualised environments)
         */
        chassis_id : string | string | null,
        
        /**
         * Port ID of the interface, as signalled in LLDP or via ARP responses from this node. Must be a MAC address
         */
        port_id : string,
        
        /**
         * Name of the interface (unique in scope of this node).  This attribute is used by sub-resources of this node such as senders and receivers to refer to interfaces to which they are bound.
         */
        name : string,
        attached_network_device? : {
            
            /**
             * Chassis ID of the attached network device, as signalled in LLDP received by this Node.
             */
            chassis_id : string | string,
            
            /**
             * Port ID of the attached network device, as signalled in LLDP received by this Node.
             */
            port_id : string | string
        }
    }>
};