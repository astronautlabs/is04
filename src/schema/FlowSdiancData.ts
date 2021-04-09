import { FlowCore } from "./FlowCore";
/**
 * Describes an SDI ancillary Flow
 */
export type FlowSdiancData = FlowCore & {
    
    /**
     * Format of the data coming from the Flow as a URN
     */
    format : string,
    
    /**
     * Subclassification of the format using IANA assigned media types
     */
    media_type : string,
    
    /**
     * List of Data identification and Secondary data identification words
     */
    DID_SDID? : Array<{
        
        /**
         * Data identification word
         */
        DID? : string,
        
        /**
         * Secondary data identification word
         */
        SDID? : string
    }>
};