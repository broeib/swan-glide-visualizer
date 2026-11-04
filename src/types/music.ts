/**
 * Music domain types for the Swan Glide Visualizer.
 *
 * Defines contracts for voice notes, guitar chord diagrams, chord steps,
 * and the progression timeline.
 */

/**
 * A single monophonic pitch within a chord step.
 * Defined by its note name, MIDI value, display pitch, and layer color.
 */
export interface VoiceNote {
  /** Note pitch string in scientific pitch notation (e.g. "F2", "Ab4"). */
  pitch: string;
  /** Standard MIDI note number (e.g. 41 for F2, 60 for C4, 79 for G5). */
  midi: number;
  /** UI display label for the pitch (e.g. "F2"). */
  label: string;
  /** Hex color string for voice ribbon and node rendering (e.g. "#4F46E5"). */
  color: string;
}

/**
 * Represents a barre across multiple strings on the guitar fretboard.
 * Strings are 1-indexed: 1 is high E, 6 is low E.
 */
export interface Barre {
  /** Starting string for the barre (1 to 6, where 1 is high E and 6 is low E). */
  fromString: number;
  /** Ending string for the barre (1 to 6, where 1 is high E and 6 is low E). */
  toString: number;
  /** Fret number where the barre is held. */
  fret: number;
}

/**
 * A 6-string guitar chord voicing for the chord box diagram.
 * Frets array ordered from string 6 (low E) to string 1 (high E).
 */
export interface GuitarChordVoicing {
  /**
   * Array of 6 frets from string 6 (low E) to string 1 (high E).
   * Values are fret numbers, 0 for open string, or 'x' for muted string.
   */
  frets: (number | 'x')[];
  /** Starting fret displayed at the top of the chord box (default 1). */
  baseFret?: number;
  /** Barre indicators for multi-string holds. */
  barres?: Barre[];
  /** Array of 6 note names corresponding to each string from string 6 to string 1. */
  stringNotes: string[];
}

/**
 * A distinct harmonic unit in the progression timeline.
 */
export interface ChordStep {
  /** Roman or jazz chord symbol (e.g. "Fm9", "C7(b13)"). */
  chordName: string;
  /** Social or artist attribution handle (e.g. "@ultravioletchorus"). */
  artistHandle: string;
  /** Duration of this step in musical beats (e.g. 4). */
  durationBeats: number;
  /** Strictly 5 voices sorted in ascending pitch order. */
  voices: VoiceNote[];
  /** 6-string guitar diagram configuration for this chord. */
  guitarDiagram: GuitarChordVoicing;
}

/**
 * Timeline position resolution output.
 */
export interface StepBeatResolution {
  /** Active chord step at the queried beat. */
  step: ChordStep;
  /** Zero-based index of the active step in the progression. */
  stepIndex: number;
  /** Beat offset relative to the start of the current step. */
  beatWithinStep: number;
}

/**
 * Progression timeline interface managing playback timing and chord steps.
 */
export interface ProgressionTimeline {
  /** Array of ordered chord steps in the progression. */
  steps: ChordStep[];
  /** Tempo in beats per minute. */
  bpm: number;
  /** Returns total duration of the progression in musical beats. */
  getTotalBeats: () => number;
  /** Returns total duration of the progression in seconds based on bpm. */
  getTotalDurationSeconds: () => number;
  /** Resolves the active chord step and relative beat for any given timeline beat. */
  getStepAtBeat: (beat: number) => StepBeatResolution;
}

/**
 * Standard palette colors for the 5 voice layers.
 * Ordered from lowest pitch (Bass) to highest pitch (Soprano).
 */
export const VOICE_PALETTE = [
  '#4F46E5', // Bass: indigo
  '#EC4899', // Tenor: pink
  '#F43F5E', // Alto: rose
  '#8B5CF6', // Mezzo: purple
  '#06B6D4', // Soprano: cyan
] as const;

/**
 * Standard names for the 5 voice ribbon layers.
 */
export const VOICE_ROLES = [
  'Bass',
  'Tenor',
  'Alto',
  'Mezzo',
  'Soprano',
] as const;
