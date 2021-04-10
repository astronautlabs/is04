import { ReceiverVideo } from "./ReceiverVideo";
import { ReceiverAudio } from "./ReceiverAudio";
import { ReceiverData } from "./ReceiverData";
import { ReceiverMux } from "./ReceiverMux";
/**
 * Describes a Receiver
 */
export type Receiver = ReceiverVideo | ReceiverAudio | ReceiverData | ReceiverMux;