import { ReceiverCore } from "./ReceiverCore";
/**
 * Describes a data Receiver
 */
export type ReceiverData = ReceiverCore & {
    
    /**
     * Type of Flow accepted by the Receiver as a URN
     */
    format : string,
    
    /**
     * Capabilities
     */
    caps : {
        
        /**
         * Subclassification of the formats accepted using IANA assigned media types
         */
        media_types? : Array<string>,
        
        /**
         * Subclassification of the event types accepted defined by the AMWA IS-07 specification
         */
        event_types? : Array<string>
    }
};