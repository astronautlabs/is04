import { Node } from "./Node";
import { Device } from "./Device";
import { Source } from "./Source";
import { Flow } from "./Flow";
import { Sender } from "./Sender";
import { Receiver } from "./Receiver";
/**
 * Describes a data Grain sent via the a Query API websocket subscription
 */
export type QueryApiSubscriptionsWebsocket = {
    
    /**
     * Type of data contained within the 'grain' attribute's payload
     */
    grain_type : string,
    
    /**
     * Source ID of the Query API instance issuing the data Grain
     */
    source_id : string,
    
    /**
     * Subscription ID under the /subscriptions/ resource of the Query API
     */
    flow_id : string,
    
    /**
     * TAI timestamp at which this data Grain's payload was generated in the format <ts_secs>:<ts_nsecs>
     */
    origin_timestamp : string,
    
    /**
     * TAI timestamp at which this data Grain's payload was generated in the format <ts_secs>:<ts_nsecs>
     */
    sync_timestamp : string,
    
    /**
     * TAI timestamp at which this data Grain's metadata was generated in the format <ts_secs>:<ts_nsecs>
     */
    creation_timestamp : string,
    
    /**
     * Rate at which Grains will be received within this Flow (if applicable)
     */
    rate : {
        
        /**
         * Numerator of the Grain rate
         */
        numerator : number,
        
        /**
         * Denominator of the Grain rate
         */
        denominator : number
    },
    
    /**
     * Duration over which this Grain is valid or should be presented (if applicable)
     */
    duration : {
        
        /**
         * Numerator of the Grain duration
         */
        numerator : number,
        
        /**
         * Denominator of the Grain duration
         */
        denominator : number
    },
    
    /**
     * Payload of the data Grain
     */
    grain : {
        
        /**
         * Format classifier for the data contained in this payload
         */
        type : string,
        
        /**
         * Query API topic which has been subscribed to using this websocket
         */
        topic : string,
        
        /**
         * An array of changes which have occurred and are being passed to the subscription client
         */
        data : Array<{
            
            /**
             * ID of the resource which has undergone a change (may be a Node ID, Device ID etc.)
             */
            path : string,
            
            /**
             * Representation of the resource undergoing a change prior to the change occurring. Omitted if the resource didn't previously exist.
             */
            pre? : Node | Device | Source | Flow | Sender | Receiver,
            
            /**
             * Representation of the resource undergoing a change after the change had occurred. Omitted if the resource no longer exists.
             */
            post? : Node | Device | Source | Flow | Sender | Receiver
        }>
    }
};