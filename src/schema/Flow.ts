import { FlowVideoRaw } from "./FlowVideoRaw";
import { FlowVideoCoded } from "./FlowVideoCoded";
import { FlowAudioRaw } from "./FlowAudioRaw";
import { FlowAudioCoded } from "./FlowAudioCoded";
import { FlowData } from "./FlowData";
import { FlowSdiancData } from "./FlowSdiancData";
import { FlowJsonData } from "./FlowJsonData";
import { FlowMux } from "./FlowMux";
/**
 * Describes a Flow
 */
export type Flow = FlowVideoRaw | FlowVideoCoded | FlowAudioRaw | FlowAudioCoded | FlowData | FlowSdiancData | FlowJsonData | FlowMux;