import { ResourceCore } from "./ResourceCore";
/**
 * Describes a Source
 */
export type SourceCore = ResourceCore & {
    
    /**
     * Maximum number of Grains per second for Flows derived from this Source. Corresponding Flow Grain rates may override this attribute. Grain rate matches the frame rate for video (see NMOS Content Model). Specified for periodic Sources only.
     */
    grain_rate? : {
        
        /**
         * Numerator
         */
        numerator : number,
        
        /**
         * Denominator
         */
        denominator? : number
    },
    
    /**
     * Capabilities (not yet defined)
     */
    caps : {
        
    },
    
    /**
     * Globally unique identifier for the Device which initially created the Source. This attribute is used to ensure referential integrity by registry implementations.
     */
    device_id : string,
    
    /**
     * Array of UUIDs representing the Source IDs of Grains which came together at the input to this Source (may change over the lifetime of this Source)
     */
    parents : Array<string>,
    
    /**
     * Reference to clock in the originating Node
     */
    clock_name : string | null
};