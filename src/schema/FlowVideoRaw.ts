import { FlowVideo } from "./FlowVideo";
/**
 * Describes a raw Video Flow
 */
export type FlowVideoRaw = FlowVideo & {
    
    /**
     * Subclassification of the format using IANA assigned media types
     */
    media_type : string,
    
    /**
     * Array of objects describing the components
     */
    components : Array<{
        
        /**
         * Name of this component
         */
        name : string,
        
        /**
         * Width of this component in pixels
         */
        width : number,
        
        /**
         * Height of this component in pixels
         */
        height : number,
        
        /**
         * Number of bits used to describe each sample
         */
        bit_depth : number
    }>
};