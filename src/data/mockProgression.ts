import {
  ChordStep,
  ProgressionTimeline,
  StepBeatResolution,
  VOICE_PALETTE,
} from '../types/music';

/**
 * 4-chord looping neo-soul progression dataset.
 *
 * Sequence: Fm9 -> Ebm9 -> Bbm9 -> C7(b13)
 * Each chord step spans 4 musical beats with strictly 5 voices sorted in ascending pitch order.
 */
export const mockChordSteps: ChordStep[] = [
  {
    chordName: 'Fm9',
    artistHandle: '@ultravioletchorus',
    durationBeats: 4,
    voices: [
      { pitch: 'F2', midi: 41, label: 'F2', color: VOICE_PALETTE[0] },
      { pitch: 'Ab4', midi: 68, label: 'Ab4', color: VOICE_PALETTE[1] },
      { pitch: 'C5', midi: 72, label: 'C5', color: VOICE_PALETTE[2] },
      { pitch: 'Eb5', midi: 75, label: 'Eb5', color: VOICE_PALETTE[3] },
      { pitch: 'G5', midi: 79, label: 'G5', color: VOICE_PALETTE[4] },
    ],
    guitarDiagram: {
      frets: [1, 3, 1, 1, 1, 3],
      baseFret: 1,
      barres: [{ fromString: 6, toString: 1, fret: 1 }],
      stringNotes: ['F', 'C', 'Eb', 'Ab', 'C', 'G'],
    },
  },
  {
    chordName: 'Ebm9',
    artistHandle: '@ultravioletchorus',
    durationBeats: 4,
    voices: [
      { pitch: 'Eb2', midi: 39, label: 'Eb2', color: VOICE_PALETTE[0] },
      { pitch: 'Gb4', midi: 66, label: 'Gb4', color: VOICE_PALETTE[1] },
      { pitch: 'Bb4', midi: 70, label: 'Bb4', color: VOICE_PALETTE[2] },
      { pitch: 'Db5', midi: 73, label: 'Db5', color: VOICE_PALETTE[3] },
      { pitch: 'F5', midi: 77, label: 'F5', color: VOICE_PALETTE[4] },
    ],
    guitarDiagram: {
      frets: ['x', 6, 4, 6, 6, 6],
      baseFret: 4,
      barres: [{ fromString: 3, toString: 1, fret: 6 }],
      stringNotes: ['x', 'Eb', 'Gb', 'Db', 'F', 'Bb'],
    },
  },
  {
    chordName: 'Bbm9',
    artistHandle: '@ultravioletchorus',
    durationBeats: 4,
    voices: [
      { pitch: 'Bb1', midi: 34, label: 'Bb1', color: VOICE_PALETTE[0] },
      { pitch: 'F4', midi: 65, label: 'F4', color: VOICE_PALETTE[1] },
      { pitch: 'Ab4', midi: 68, label: 'Ab4', color: VOICE_PALETTE[2] },
      { pitch: 'C5', midi: 72, label: 'C5', color: VOICE_PALETTE[3] },
      { pitch: 'Db5', midi: 73, label: 'Db5', color: VOICE_PALETTE[4] },
    ],
    guitarDiagram: {
      frets: [6, 8, 6, 6, 6, 8],
      baseFret: 6,
      barres: [{ fromString: 6, toString: 1, fret: 6 }],
      stringNotes: ['Bb', 'F', 'Ab', 'Db', 'F', 'C'],
    },
  },
  {
    chordName: 'C7(b13)',
    artistHandle: '@ultravioletchorus',
    durationBeats: 4,
    voices: [
      { pitch: 'C2', midi: 36, label: 'C2', color: VOICE_PALETTE[0] },
      { pitch: 'E4', midi: 64, label: 'E4', color: VOICE_PALETTE[1] },
      { pitch: 'Ab4', midi: 68, label: 'Ab4', color: VOICE_PALETTE[2] },
      { pitch: 'Bb4', midi: 70, label: 'Bb4', color: VOICE_PALETTE[3] },
      { pitch: 'D5', midi: 74, label: 'D5', color: VOICE_PALETTE[4] },
    ],
    guitarDiagram: {
      frets: [8, 'x', 8, 9, 9, 8],
      baseFret: 8,
      barres: [{ fromString: 6, toString: 1, fret: 8 }],
      stringNotes: ['C', 'x', 'Bb', 'E', 'Ab', 'C'],
    },
  },
];

/**
 * Creates a ProgressionTimeline instance from chord steps and target BPM.
 */
export function createProgressionTimeline(
  steps: ChordStep[],
  bpm: number = 72,
): ProgressionTimeline {
  return {
    steps,
    bpm,
    getTotalBeats(): number {
      return this.steps.reduce((acc, step) => acc + step.durationBeats, 0);
    },
    getTotalDurationSeconds(): number {
      const beats = this.getTotalBeats();
      return (beats / this.bpm) * 60;
    },
    getStepAtBeat(beat: number): StepBeatResolution {
      const totalBeats = this.getTotalBeats();
      if (totalBeats <= 0 || this.steps.length === 0) {
        throw new Error('Progression has no steps or beats');
      }

      // Loop cleanly when beat reaches or exceeds totalBeats, or when negative
      const normalizedBeat = ((beat % totalBeats) + totalBeats) % totalBeats;
      let accumulated = 0;

      for (let i = 0; i < this.steps.length; i++) {
        const currentStep = this.steps[i];
        if (!currentStep) {
          continue;
        }

        const nextAccumulated = accumulated + currentStep.durationBeats;
        if (normalizedBeat < nextAccumulated || i === this.steps.length - 1) {
          return {
            step: currentStep,
            stepIndex: i,
            beatWithinStep: normalizedBeat - accumulated,
          };
        }
        accumulated = nextAccumulated;
      }

      const firstStep = this.steps[0];
      if (!firstStep) {
        throw new Error('Progression has no steps');
      }

      return {
        step: firstStep,
        stepIndex: 0,
        beatWithinStep: 0,
      };
    },
  };
}

/**
 * Default mock progression instance configured at 72 BPM.
 */
export const mockProgression: ProgressionTimeline = createProgressionTimeline(
  mockChordSteps,
  72,
);
