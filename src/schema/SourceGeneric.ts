import { SourceCore } from "./SourceCore";
/**
 * Describes a generic Source
 */
export type SourceGeneric = SourceCore & {
    
    /**
     * Format of the data coming from the Source as a URN
     */
    format : string
};