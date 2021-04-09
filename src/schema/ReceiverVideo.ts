import { ReceiverCore } from "./ReceiverCore";
/**
 * Describes a video Receiver
 */
export type ReceiverVideo = ReceiverCore & {
    
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
        media_types? : Array<string>
    }
};