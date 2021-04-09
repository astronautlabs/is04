import { ResourceCore } from "./ResourceCore";
/**
 * Describes a Flow
 */
export type FlowCore = ResourceCore & {
    
    /**
     * Number of Grains per second for this Flow. Must be an integer division of, or equal to the Grain rate specified by the parent Source. Grain rate matches the frame rate for video (see NMOS Content Model). Specified for periodic Flows only.
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
     * Globally unique identifier for the Source which initially created the Flow. This attribute is used to ensure referential integrity by registry implementations (v1.0 only).
     */
    source_id : string,
    
    /**
     * Globally unique identifier for the Device which initially created the Flow. This attribute is used to ensure referential integrity by registry implementations (v1.1 onwards).
     */
    device_id : string,
    
    /**
     * Array of UUIDs representing the Flow IDs of Grains which came together to generate this Flow (may change over the lifetime of this Flow)
     */
    parents : Array<string>
};