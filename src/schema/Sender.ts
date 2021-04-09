import { ResourceCore } from "./ResourceCore";
/**
 * Describes a sender
 */
export type Sender = ResourceCore & {
    
    /**
     * Capabilities of this sender
     */
    caps? : {
        
    },
    
    /**
     * ID of the Flow currently passing via this Sender
     */
    flow_id : string | null,
    
    /**
     * Transport type used by the Sender in URN format
     */
    transport : string,
    
    /**
     * Device ID which this Sender forms part of. This attribute is used to ensure referential integrity by registry implementations.
     */
    device_id : string,
    
    /**
     * HTTP(S) accessible URL to a file describing how to connect to the Sender.
     */
    manifest_href : string | null,
    
    /**
     * Binding of Sender egress ports to interfaces on the parent Node.
     */
    interface_bindings : Array<string>,
    
    /**
     * Object containing the 'receiver_id' currently subscribed to (unicast only).
     */
    subscription : {
        
        /**
         * UUID of the Receiver that this Sender is currently subscribed to
         */
        receiver_id : string | null,
        
        /**
         * Sender is enabled and configured to send data
         */
        active : boolean
    }
};