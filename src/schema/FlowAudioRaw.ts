import { FlowAudio } from "./FlowAudio";
/**
 * Describes a raw audio Flow
 */
export type FlowAudioRaw = FlowAudio & {
    
    /**
     * Subclassification of the format using IANA assigned media types
     */
    media_type : string,
    
    /**
     * Bit depth of the audio samples
     */
    bit_depth : number
};