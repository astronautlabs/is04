import { ResourceCore } from "./ResourceCore";
/**
 * Describes a receiver
 */
export type ReceiverCore = ResourceCore & {
    
    /**
     * Device ID which this Receiver forms part of. This attribute is used to ensure referential integrity by registry implementations.
     */
    device_id : string,
    
    /**
     * Transport type accepted by the Receiver in URN format
     */
    transport : string,
    
    /**
     * Binding of Receiver ingress ports to interfaces on the parent Node.
     */
    interface_bindings : Array<string>,
    
    /**
     * Object containing the 'sender_id' currently subscribed to.
     */
    subscription : {
        
        /**
         * UUID of the Sender that this Receiver is currently subscribed to
         */
        sender_id : string | null,
        
        /**
         * Receiver is enabled and configured with a Sender's connection parameters
         */
        active : boolean
    }
};