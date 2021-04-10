import { SourceGeneric } from "./SourceGeneric";
import { SourceAudio } from "./SourceAudio";
import { SourceData } from "./SourceData";
/**
 * Describes a Source
 */
export type Source = SourceGeneric | SourceAudio | SourceData;