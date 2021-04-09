
/**
 * Describes a clock referenced to PTP
 */
export type ClockPtp = {
    
    /**
     * Name of this refclock (unique for this set of clocks)
     */
    name : string,
    
    /**
     * Type of external reference used by this clock
     */
    ref_type : string,
    
    /**
     * External refclock is synchronised to International Atomic Time (TAI)
     */
    traceable : boolean,
    
    /**
     * Version of PTP reference used by this clock
     */
    version : string,
    
    /**
     * ID of the PTP reference used by this clock
     */
    gmid : string,
    
    /**
     * Lock state of this clock to the external reference. If true, this device is slaved, otherwise it has no defined relationship to the external reference
     */
    locked : boolean
};