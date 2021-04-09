import { FlowCore } from "./FlowCore";
/**
 * Describes a mux Flow
 */
export type FlowMux = FlowCore & {
    
    /**
     * Format of the data coming from the Flow as a URN
     */
    format : string,
    
    /**
     * Subclassification of the format using IANA assigned media types
     */
    media_type : string
};