import { FlowAudio } from "./FlowAudio";
/**
 * Describes a coded audio Flow
 */
export type FlowAudioCoded = FlowAudio & {
    
    /**
     * Subclassification of the format using IANA assigned media types
     */
    media_type : string
};