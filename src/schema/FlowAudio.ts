import { FlowCore } from "./FlowCore";
/**
 * Describes an audio Flow
 */
export type FlowAudio = FlowCore & {
    
    /**
     * Format of the data coming from the Flow as a URN
     */
    format : string,
    
    /**
     * Number of audio samples per second for this Flow
     */
    sample_rate : {
        
        /**
         * Numerator
         */
        numerator : number,
        
        /**
         * Denominator
         */
        denominator? : number
    }
};