import { FlowVideoRaw } from "./FlowVideoRaw";
import { FlowVideoCoded } from "./FlowVideoCoded";
import { FlowAudioRaw } from "./FlowAudioRaw";
import { FlowAudioCoded } from "./FlowAudioCoded";
import { FlowData } from "./FlowData";
import { FlowSdiAncData } from "./FlowSdiAncData";
import { FlowJsonData } from "./FlowJsonData";
import { FlowMux } from "./FlowMux";
/**
 * Describes a Flow
 */
export type Flow = FlowVideoRaw | FlowVideoCoded | FlowAudioRaw | FlowAudioCoded | FlowData | FlowSdiAncData | FlowJsonData | FlowMux;