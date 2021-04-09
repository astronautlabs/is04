
/**
 * A single subscription to a Query API
 */
export type QueryapiSubscriptionResponse = {
    
    /**
     * Globally unique identifier for the subscription
     */
    id : string,
    
    /**
     * Address to connect to for the websocket subscription
     */
    ws_href : string,
    
    /**
     * Rate limiting for messages. Sets the minimum interval (in milliseconds) between consecutive WebSocket messages.
     */
    max_update_rate_ms : number,
    
    /**
     * Whether the API will retain or destroy the subscription after the final client disconnects
     */
    persist : boolean,
    
    /**
     * Whether a secure WebSocket connection (wss://) is required.
     */
    secure : boolean,
    
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
     * Whether the WebSocket connection requires authorization.
     */
    authorization? : boolean
};