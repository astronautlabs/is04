import { FlowVideo } from "./FlowVideo";
/**
 * Describes a coded Video Flow
 */
export type FlowVideoCoded = FlowVideo & {
    
    /**
     * Subclassification of the format using IANA assigned media types
     */
    media_type : string
};