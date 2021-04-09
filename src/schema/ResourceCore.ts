
/**
 * Describes the foundations of all NMOS resources
 */
export type ResourceCore = {
    
    /**
     * Globally unique identifier for the resource
     */
    id : string,
    
    /**
     * String formatted TAI timestamp (<seconds>:<nanoseconds>) indicating precisely when an attribute of the resource last changed
     */
    version : string,
    
    /**
     * Freeform string label for the resource
     */
    label : string,
    
    /**
     * Detailed description of the resource
     */
    description : string,
    
    /**
     * Key value set of freeform string tags to aid in filtering resources. Values should be represented as an array of strings. Can be empty.
     */
    tags : {
        
    }
};