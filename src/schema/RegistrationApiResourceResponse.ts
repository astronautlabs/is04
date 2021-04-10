import { Node } from "./Node";
import { Device } from "./Device";
import { Source } from "./Source";
import { Flow } from "./Flow";
import { Sender } from "./Sender";
import { Receiver } from "./Receiver";
/**
 * Returning a registered resource from the Registration API
 */
export type RegistrationApiResourceResponse = Node | Device | Source | Flow | Sender | Receiver;