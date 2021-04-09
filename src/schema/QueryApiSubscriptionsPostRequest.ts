
/**
 * Create a new subscription to a Query API
 */
export type QueryApiSubscriptionsPostRequest = {
    
    /**
     * Rate limiting for messages. Sets the minimum interval (in milliseconds) between consecutive WebSocket messages.
     */
    max_update_rate_ms : number,
    
    /**
     * Whether the API will retain or destroy the subscription after the final client disconnects
     */
    persist : boolean,
    
    /**
     * Whether a secure WebSocket connection (wss://) is required. NB: Default should be 'true' if the API is being presented via HTTPS, and 'false' otherwise.
     */
    secure? : boolean,
    
    /**
     * HTTP resource path in the Query API to which this subscription relates
     */
    resource_path : string,
    
    /**
     * Object containing attributes to filter the resource on as per the Query Parameters specification. Can be empty.
     */
    params : {
        
    },
    
    /**
     * Whether the WebSocket connection requires authorization. NB: Default should be 'true' if the API requires authorization, and 'false' otherwise.
     */
    authorization? : boolean
};