import { Node } from "./Node";
import { Device } from "./Device";
import { Sender } from "./Sender";
import { Receiver } from "./Receiver";
import { Source } from "./Source";
import { Flow } from "./Flow";
/**
 * Register a new resource or update an existing resource
 */
export type RegistrationApiResourcePostRequest = {
    
    /**
     * Singular form of the resource type to be registered
     */
    type? : string,
    data? : Node
} | {
    
    /**
     * Singular form of the resource type to be registered
     */
    type? : string,
    data? : Device
} | {
    
    /**
     * Singular form of the resource type to be registered
     */
    type? : string,
    data? : Sender
} | {
    
    /**
     * Singular form of the resource type to be registered
     */
    type? : string,
    data? : Receiver
} | {
    
    /**
     * Singular form of the resource type to be registered
     */
    type? : string,
    data? : Source
} | {
    
    /**
     * Singular form of the resource type to be registered
     */
    type? : string,
    data? : Flow
};