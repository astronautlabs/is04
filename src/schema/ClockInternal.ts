
/**
 * Describes a clock with no external reference
 */
export type ClockInternal = {
    
    /**
     * Name of this refclock (unique for this set of clocks)
     */
    name : string,
    
    /**
     * Type of external reference used by this clock
     */
    ref_type : string
};