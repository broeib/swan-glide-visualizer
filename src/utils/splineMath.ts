import { ProgressionTimeline, VoiceNote } from '../types/music';

/**
 * Math helpers for rendering the voice leading spline timeline.
 *
 * Implements cubic Hermite S-curves, screen coordinate mappings,
 * and periodic voice pitch interpolation across looping chord steps.
 */

/** Default horizontal playhead anchor at 35% from the left edge. */
export const DEFAULT_PLAYHEAD_RATIO = 0.35;

/** Default number of musical beats visible across the canvas width. */
export const DEFAULT_VISIBLE_BEATS = 8;

/** Default duration in musical beats for the cubic S-curve pitch transition. */
export const DEFAULT_TRANSITION_BEATS = 0.5;

/** Default lower bound for MIDI note mapping (Bb1 is MIDI 34). */
export const DEFAULT_MIN_MIDI = 30;

/** Default upper bound for MIDI note mapping (G5 is MIDI 79). */
export const DEFAULT_MAX_MIDI = 85;

/** Default vertical padding in pixels for canvas rendering. */
export const DEFAULT_PADDING_Y = 40;

/**
 * Options for configuring MIDI to canvas Y-coordinate mapping.
 */
export interface MidiYMappingOptions {
  minMidi?: number;
  maxMidi?: number;
  paddingTop?: number;
  paddingBottom?: number;
}

/**
 * Cubic Hermite / Bezier S-curve interpolation between two values.
 *
 * With default zero slopes (m0 = 0, m1 = 0), this produces a smoothstep
 * S-curve with zero first derivative at both endpoints t = 0 and t = 1.
 *
 * @param p0 Starting value at t = 0.
 * @param p1 Ending value at t = 1.
 * @param t Normalized interpolation factor clamped to [0, 1].
 * @param m0 Optional tangent slope at t = 0 (default 0).
 * @param m1 Optional tangent slope at t = 1 (default 0).
 * @returns Interpolated value.
 */
export function cubicHermite(
  p0: number,
  p1: number,
  t: number,
  m0: number = 0,
  m1: number = 0,
): number {
  const clampedT = Math.max(0, Math.min(1, t));
  const t2 = clampedT * clampedT;
  const t3 = t2 * clampedT;

  const h00 = 2 * t3 - 3 * t2 + 1;
  const h10 = t3 - 2 * t2 + clampedT;
  const h01 = -2 * t3 + 3 * t2;
  const h11 = t3 - t2;

  return h00 * p0 + h10 * m0 + h01 * p1 + h11 * m1;
}

/**
 * Cubic ease-in-out smoothstep curve for normalized parameter t in [0, 1].
 */
export function cubicEaseInOut(t: number): number {
  const clampedT = Math.max(0, Math.min(1, t));
  return clampedT * clampedT * (3 - 2 * clampedT);
}

/**
 * Calculates the horizontal pixel coordinate of the playhead.
 *
 * @param width Canvas width in CSS pixels.
 * @param playheadRatio Fractional offset from left edge (default 0.35).
 */
export function getPlayheadX(
  width: number,
  playheadRatio: number = DEFAULT_PLAYHEAD_RATIO,
): number {
  return width * playheadRatio;
}

/**
 * Calculates horizontal pixels per musical beat.
 *
 * @param width Canvas width in CSS pixels.
 * @param visibleBeats Number of beats visible across canvas width (default 8).
 */
export function getPixelsPerBeat(
  width: number,
  visibleBeats: number = DEFAULT_VISIBLE_BEATS,
): number {
  return visibleBeats > 0 ? width / visibleBeats : width;
}

/**
 * Converts a musical beat to an X-coordinate on the canvas.
 *
 * The timeline scrolls right-to-left under the fixed playhead as current beat advances.
 * At beat === currentBeat, the result is exactly playheadX.
 * Future beats (beat > currentBeat) appear to the right (x > playheadX).
 * Past beats (beat < currentBeat) appear to the left (x < playheadX).
 *
 * @param beat The target beat to position.
 * @param currentBeat Current active playback beat.
 * @param width Canvas width in CSS pixels.
 * @param visibleBeats Visible window in beats.
 * @param playheadRatio Anchor ratio for the playhead (default 0.35).
 */
export function beatToX(
  beat: number,
  currentBeat: number,
  width: number,
  visibleBeats: number = DEFAULT_VISIBLE_BEATS,
  playheadRatio: number = DEFAULT_PLAYHEAD_RATIO,
): number {
  const playheadX = getPlayheadX(width, playheadRatio);
  const ppb = getPixelsPerBeat(width, visibleBeats);
  return playheadX + (beat - currentBeat) * ppb;
}

/**
 * Converts a canvas X-coordinate back into a musical beat.
 *
 * @param x Canvas horizontal coordinate.
 * @param currentBeat Current active playback beat.
 * @param width Canvas width in CSS pixels.
 * @param visibleBeats Visible window in beats.
 * @param playheadRatio Anchor ratio for the playhead (default 0.35).
 */
export function xToBeat(
  x: number,
  currentBeat: number,
  width: number,
  visibleBeats: number = DEFAULT_VISIBLE_BEATS,
  playheadRatio: number = DEFAULT_PLAYHEAD_RATIO,
): number {
  const playheadX = getPlayheadX(width, playheadRatio);
  const ppb = getPixelsPerBeat(width, visibleBeats);
  if (ppb === 0) {
    return currentBeat;
  }
  return currentBeat + (x - playheadX) / ppb;
}

/**
 * Converts normalized loop progress (0.0 to 1.0) to current beat in progression.
 */
export function progressToBeat(progress: number, totalBeats: number): number {
  if (totalBeats <= 0) {
    return 0;
  }
  const normalized = ((progress % 1) + 1) % 1;
  return normalized * totalBeats;
}

/**
 * Converts a musical beat to normalized loop progress (0.0 to 1.0).
 */
export function beatToProgress(beat: number, totalBeats: number): number {
  if (totalBeats <= 0) {
    return 0;
  }
  return (((beat % totalBeats) + totalBeats) % totalBeats) / totalBeats;
}

/**
 * Converts audio time in seconds to an X-coordinate on the canvas.
 */
export function timeToX(
  timeSeconds: number,
  currentTimeSeconds: number,
  bpm: number,
  width: number,
  visibleBeats: number = DEFAULT_VISIBLE_BEATS,
  playheadRatio: number = DEFAULT_PLAYHEAD_RATIO,
): number {
  const beat = (timeSeconds / 60) * bpm;
  const currentBeat = (currentTimeSeconds / 60) * bpm;
  return beatToX(beat, currentBeat, width, visibleBeats, playheadRatio);
}

/**
 * Maps a MIDI note number to a canvas Y-coordinate.
 * Higher pitches appear at the top (smaller Y), lower pitches at the bottom (larger Y).
 *
 * @param midi MIDI note number (e.g. 34 for Bb1, 79 for G5).
 * @param height Canvas height in CSS pixels.
 * @param options Padding and MIDI range configuration.
 */
export function midiToY(
  midi: number,
  height: number,
  options?: MidiYMappingOptions,
): number {
  const minMidi = options?.minMidi ?? DEFAULT_MIN_MIDI;
  const maxMidi = options?.maxMidi ?? DEFAULT_MAX_MIDI;
  const paddingTop = options?.paddingTop ?? DEFAULT_PADDING_Y;
  const paddingBottom = options?.paddingBottom ?? DEFAULT_PADDING_Y;

  const availableHeight = Math.max(1, height - paddingTop - paddingBottom);
  const midiSpan = Math.max(1, maxMidi - minMidi);
  const normalized = (midi - minMidi) / midiSpan;

  return paddingTop + (1 - normalized) * availableHeight;
}

/**
 * Maps a canvas Y-coordinate back to an estimated MIDI note number.
 */
export function yToMidi(
  y: number,
  height: number,
  options?: MidiYMappingOptions,
): number {
  const minMidi = options?.minMidi ?? DEFAULT_MIN_MIDI;
  const maxMidi = options?.maxMidi ?? DEFAULT_MAX_MIDI;
  const paddingTop = options?.paddingTop ?? DEFAULT_PADDING_Y;
  const paddingBottom = options?.paddingBottom ?? DEFAULT_PADDING_Y;

  const availableHeight = Math.max(1, height - paddingTop - paddingBottom);
  const midiSpan = Math.max(1, maxMidi - minMidi);
  const normalized = 1 - (y - paddingTop) / availableHeight;

  return minMidi + normalized * midiSpan;
}

/**
 * State of an individual voice layer evaluated at a specific musical beat.
 */
export interface VoiceBeatState {
  voiceIndex: number;
  midi: number;
  stepIndex: number;
  fromNote: VoiceNote;
  toNote: VoiceNote;
  inTransition: boolean;
  transitionProgress: number;
  activeNote: VoiceNote;
  color: string;
  label: string;
}

/**
 * Resolves the interpolated pitch and metadata for a voice layer at any musical beat.
 *
 * Within each chord step, the pitch stays flat for (duration - transitionBeats),
 * then smoothly transitions via cubic S-curve into the next chord step's corresponding voice.
 * Seamlessly wraps around between the final step and the first step.
 *
 * @param progression Timeline containing chord steps and timing.
 * @param voiceIndex Voice layer index (0 = Bass to 4 = Soprano).
 * @param beat Musical beat (may be negative or exceed loop length).
 * @param transitionBeats Duration of transition in beats (default 0.5).
 */
export function getVoiceStateAtBeat(
  progression: ProgressionTimeline,
  voiceIndex: number,
  beat: number,
  transitionBeats: number = DEFAULT_TRANSITION_BEATS,
): VoiceBeatState {
  const totalBeats = progression.getTotalBeats();
  const numSteps = progression.steps.length;

  const fallbackNote: VoiceNote = {
    pitch: 'C4',
    midi: 60,
    label: 'C4',
    color: '#4F46E5',
  };

  if (totalBeats <= 0 || numSteps === 0) {
    return {
      voiceIndex,
      midi: 60,
      stepIndex: 0,
      fromNote: fallbackNote,
      toNote: fallbackNote,
      inTransition: false,
      transitionProgress: 0,
      activeNote: fallbackNote,
      color: fallbackNote.color,
      label: fallbackNote.label,
    };
  }

  const normalizedBeat = ((beat % totalBeats) + totalBeats) % totalBeats;

  let accumulated = 0;
  let currentStepIndex = 0;
  let beatWithinStep = 0;

  for (let i = 0; i < numSteps; i++) {
    const step = progression.steps[i];
    if (!step) {
      continue;
    }
    const stepEnd = accumulated + step.durationBeats;
    if (normalizedBeat < stepEnd || i === numSteps - 1) {
      currentStepIndex = i;
      beatWithinStep = normalizedBeat - accumulated;
      break;
    }
    accumulated = stepEnd;
  }

  const currentStep = progression.steps[currentStepIndex];
  const nextStepIndex = (currentStepIndex + 1) % numSteps;
  const nextStep = progression.steps[nextStepIndex];

  const fromNote = currentStep?.voices[voiceIndex] ?? fallbackNote;
  const toNote = nextStep?.voices[voiceIndex] ?? fromNote;

  const duration = currentStep?.durationBeats ?? 4;
  const effectiveTransitionBeats = Math.max(
    0.01,
    Math.min(transitionBeats, duration * 0.5),
  );
  const flatDuration = duration - effectiveTransitionBeats;

  if (beatWithinStep < flatDuration) {
    return {
      voiceIndex,
      midi: fromNote.midi,
      stepIndex: currentStepIndex,
      fromNote,
      toNote,
      inTransition: false,
      transitionProgress: 0,
      activeNote: fromNote,
      color: fromNote.color,
      label: fromNote.label,
    };
  }

  const transitionOffset = beatWithinStep - flatDuration;
  const t = Math.max(0, Math.min(1, transitionOffset / effectiveTransitionBeats));
  const interpolatedMidi = cubicHermite(fromNote.midi, toNote.midi, t);
  const activeNote = t < 0.5 ? fromNote : toNote;

  return {
    voiceIndex,
    midi: interpolatedMidi,
    stepIndex: currentStepIndex,
    fromNote,
    toNote,
    inTransition: true,
    transitionProgress: t,
    activeNote,
    color: fromNote.color,
    label: activeNote.label,
  };
}

/**
 * Returns the interpolated MIDI pitch value for a voice layer at a given beat.
 */
export function getVoicePitchAtBeat(
  progression: ProgressionTimeline,
  voiceIndex: number,
  beat: number,
  transitionBeats: number = DEFAULT_TRANSITION_BEATS,
): number {
  return getVoiceStateAtBeat(progression, voiceIndex, beat, transitionBeats).midi;
}

/**
 * Returns the canvas Y-coordinate for a voice layer at a given beat.
 */
export function getVoiceYAtBeat(
  progression: ProgressionTimeline,
  voiceIndex: number,
  beat: number,
  height: number,
  options?: MidiYMappingOptions,
  transitionBeats: number = DEFAULT_TRANSITION_BEATS,
): number {
  const pitch = getVoicePitchAtBeat(
    progression,
    voiceIndex,
    beat,
    transitionBeats,
  );
  return midiToY(pitch, height, options);
}

/**
 * Geometric parameters for drawing a single step occurrence ribbon.
 */
export interface RibbonStepSegment {
  stepIndex: number;
  xStart: number;
  xTransition: number;
  xEnd: number;
  yStart: number;
  yEnd: number;
  cp1: { x: number; y: number };
  cp2: { x: number; y: number };
}

/**
 * Generates continuous geometric spline segments for a voice layer
 * across the visible canvas window.
 *
 * Each segment contains the flat horizontal section followed by the
 * cubic Bezier S-curve transition into the subsequent step.
 */
export function getVoiceRibbonSegments(
  progression: ProgressionTimeline,
  voiceIndex: number,
  currentBeat: number,
  width: number,
  height: number,
  visibleBeats: number = DEFAULT_VISIBLE_BEATS,
  playheadRatio: number = DEFAULT_PLAYHEAD_RATIO,
  options?: MidiYMappingOptions,
  transitionBeats: number = DEFAULT_TRANSITION_BEATS,
): RibbonStepSegment[] {
  const totalBeats = progression.getTotalBeats();
  const numSteps = progression.steps.length;

  if (totalBeats <= 0 || numSteps === 0 || width <= 0 || height <= 0) {
    return [];
  }

  const beatStart = xToBeat(0, currentBeat, width, visibleBeats, playheadRatio);
  const beatEnd = xToBeat(width, currentBeat, width, visibleBeats, playheadRatio);

  // Extend window margin by a full chord step to guarantee seamless edge rendering
  const minBeat = beatStart - 4;
  const maxBeat = beatEnd + 4;

  const cycleMin = Math.floor(minBeat / totalBeats);
  const cycleMax = Math.floor(maxBeat / totalBeats);

  const segments: RibbonStepSegment[] = [];

  for (let cycle = cycleMin; cycle <= cycleMax; cycle++) {
    let stepStartAccumulator = cycle * totalBeats;

    for (let i = 0; i < numSteps; i++) {
      const step = progression.steps[i];
      if (!step) {
        continue;
      }
      const duration = step.durationBeats;
      const stepStartBeat = stepStartAccumulator;
      const effectiveTransition = Math.max(
        0.01,
        Math.min(transitionBeats, duration * 0.5),
      );
      const transitionStartBeat = stepStartBeat + duration - effectiveTransition;
      const stepEndBeat = stepStartBeat + duration;

      stepStartAccumulator = stepEndBeat;

      if (stepEndBeat < minBeat || stepStartBeat > maxBeat) {
        continue;
      }

      const nextStepIndex = (i + 1) % numSteps;
      const fromNote = step.voices[voiceIndex];
      const toNote = progression.steps[nextStepIndex]?.voices[voiceIndex] ?? fromNote;

      if (!fromNote || !toNote) {
        continue;
      }

      const xStart = beatToX(
        stepStartBeat,
        currentBeat,
        width,
        visibleBeats,
        playheadRatio,
      );
      const xTransition = beatToX(
        transitionStartBeat,
        currentBeat,
        width,
        visibleBeats,
        playheadRatio,
      );
      const xEnd = beatToX(
        stepEndBeat,
        currentBeat,
        width,
        visibleBeats,
        playheadRatio,
      );

      const yStart = midiToY(fromNote.midi, height, options);
      const yEnd = midiToY(toNote.midi, height, options);

      const midX = (xTransition + xEnd) / 2;

      segments.push({
        stepIndex: i,
        xStart,
        xTransition,
        xEnd,
        yStart,
        yEnd,
        cp1: { x: midX, y: yStart },
        cp2: { x: midX, y: yEnd },
      });
    }
  }

  return segments;
}
