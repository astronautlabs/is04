import { FlowCore } from "./FlowCore";
/**
 * Describes a Video Flow
 */
export type FlowVideo = FlowCore & {
    
    /**
     * Format of the data coming from the Flow as a URN
     */
    format : string,
    
    /**
     * Width of the picture in pixels
     */
    frame_width : number,
    
    /**
     * Height of the picture in pixels
     */
    frame_height : number,
    
    /**
     * Interlaced video mode for frames in this Flow
     */
    interlace_mode? : string,
    
    /**
     * Colorspace used for the video. Any values not defined in the enum should be defined in the NMOS Parameter Registers
     */
    colorspace : string,
    
    /**
     * Transfer characteristic. Any values not defined in the enum should be defined in the NMOS Parameter Registers
     */
    transfer_characteristic? : string
};