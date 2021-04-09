import { SourceCore } from "./SourceCore";
/**
 * Describes an audio Source
 */
export type SourceAudio = SourceCore & {
    
    /**
     * Format of the data coming from the Source as a URN
     */
    format : string,
    
    /**
     * Array of objects describing the audio channels
     */
    channels : Array<{
        
        /**
         * Label for this channel (free text)
         */
        label : string,
        
        /**
         * Symbol for this channel (from VSF TR-03 Appendix A)
         */
        symbol? : string
    }>
};