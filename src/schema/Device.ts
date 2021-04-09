import { ResourceCore } from "./ResourceCore";
/**
 * Describes a Device
 */
export type Device = ResourceCore & {
    
    /**
     * Device type URN
     */
    type : string,
    
    /**
     * Globally unique identifier for the Node which initially created the Device. This attribute is used to ensure referential integrity by registry implementations.
     */
    node_id : string,
    
    /**
     * UUIDs of Senders attached to the Device (deprecated)
     */
    senders : Array<string>,
    
    /**
     * UUIDs of Receivers attached to the Device (deprecated)
     */
    receivers : Array<string>,
    
    /**
     * Control endpoints exposed for the Device
     */
    controls : Array<{
        
        /**
         * URL to reach a control endpoint, whether http or otherwise
         */
        href : string,
        
        /**
         * URN identifying the control format
         */
        type : string,
        
        /**
         * This endpoint requires authorization
         */
        authorization? : boolean
    }>
};