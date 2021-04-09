
/**
 * Describes the standard error response which is returned with HTTP codes 400 and above
 */
export type Error = {
    
    /**
     * HTTP error code
     */
    code : number,
    
    /**
     * Human readable message which is suitable for user interface display, and helpful to the user
     */
    error : string,
    
    /**
     * Debug information which may assist a programmer working with the API
     */
    debug : null | string
};