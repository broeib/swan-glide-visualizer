import { ProgressionTimeline } from '../../types/music';

/**
 * The four curated harmonic mood archetypes for procedural generation.
 */
export type MoodArchetype =
  | 'dreamy-major'
  | 'melancholy-minor'
  | 'spicy-altered'
  | 'smooth-rnb';

/**
 * Chromatic pitch classes supported across all 12 key centers.
 */
export type PitchClass =
  | 'C'
  | 'Db'
  | 'D'
  | 'Eb'
  | 'E'
  | 'F'
  | 'Gb'
  | 'G'
  | 'Ab'
  | 'A'
  | 'Bb'
  | 'B';

/**
 * Specification for a relative chord step in a cadence template.
 */
export interface CadenceChordSpec {
  /** Semitone offset of the chord root from the key center (0 to 11). */
  rootOffset: number;
  /** Roman numeral or descriptive role (e.g. "Imaj9", "subV7", "iv9"). */
  role: string;
  /** Chord extension or quality symbol (e.g. "maj9", "7(#9)", "m11"). */
  extension: string;
  /** Duration of this step in musical beats (typically 2 to 4). */
  durationBeats: number;
  /** Optional explicit bass degree offset if an inversion is requested. */
  bassOffset?: number;
}

/**
 * A curated harmonic cadence template within a mood archetype.
 */
export interface CadenceTemplate {
  /** Unique template identifier. */
  id: string;
  /** Human-readable title for the progression pattern. */
  name: string;
  /** Associated mood archetype. */
  mood: MoodArchetype;
  /** Stylistic description of the progression. */
  description: string;
  /** Ordered sequence of relative chord specifications. */
  chords: CadenceChordSpec[];
  /** Recommended tempo range [minBpm, maxBpm]. */
  tempoRange: [number, number];
}

/**
 * Options for procedural progression generation.
 */
export interface GenerateProgressionOptions {
  /** Desired mood archetype. Defaults to a random selection. */
  mood?: MoodArchetype;
  /** Desired key center pitch class. Defaults to an authentic key center. */
  key?: PitchClass;
  /** Desired tempo in beats per minute. Defaults to template recommended BPM. */
  bpm?: number;
  /** Target chord count (4 to 8). When specified, selects or trims matching templates. */
  chordCount?: number;
}

/**
 * Harmonic metadata attached to a generated progression timeline.
 */
export interface ProgressionMetadata {
  /** Selected mood archetype. */
  mood: MoodArchetype;
  /** Harmonic key center. */
  key: PitchClass;
  /** Cadence template identifier. */
  templateId: string;
  /** Stylistic description. */
  description: string;
  /** Ordered list of chord symbols. */
  chordNames: string[];
  /** Total progression duration in musical beats. */
  totalBeats: number;
  /** Allow indexing for timeline metadata compatibility. */
  [key: string]: unknown;
}

/**
 * Extended progression timeline containing generation metadata.
 */
export interface GeneratedProgressionTimeline extends ProgressionTimeline {
  /** Harmonic generation metadata. */
  metadata: ProgressionMetadata;
}
