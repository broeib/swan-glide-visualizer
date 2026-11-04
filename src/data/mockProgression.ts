import {
  ChordStep,
  ProgressionTimeline,
  StepBeatResolution,
  VOICE_PALETTE,
} from '../types/music';

/**
 * The authentic Neo-Soul chord progression matching the Swan Glide video:
 * Dbmaj9 -> C7(#9) -> Fm9 -> Ebm9 -> Ab13 -> Dbmaj7(#11) -> C7(b13)
 *
 * Total duration: 24 beats (24 seconds at 60 BPM).
 */
export const referenceChordSteps: ChordStep[] = [
  {
    chordName: 'Dbmaj9',
    chordRoot: 'D',
    chordAccidental: 'b',
    chordExtension: 'maj9',
    artistHandle: '@ultravioletchorus',
    durationBeats: 4,
    voices: [
      { pitch: 'Db2', midi: 37, label: 'Db2', color: VOICE_PALETTE[0] },
      { pitch: 'Db4', midi: 61, label: 'Db4', color: VOICE_PALETTE[1] },
      { pitch: 'Eb4', midi: 63, label: 'Eb4', color: VOICE_PALETTE[2] },
      { pitch: 'F4', midi: 65, label: 'F4', color: VOICE_PALETTE[3] },
      { pitch: 'Ab4', midi: 68, label: 'Ab4', color: VOICE_PALETTE[4] },
      { pitch: 'C5', midi: 72, label: 'C5', color: VOICE_PALETTE[5] },
    ],
    guitarDiagram: {
      frets: ['x', 4, 3, 5, 4, 'x'],
      baseFret: 3,
      stringNotes: ['x', 'Db', 'F', 'C', 'Eb', 'x'],
    },
  },
  {
    chordName: 'C7(#9)',
    chordRoot: 'C',
    chordAccidental: '',
    chordExtension: '7(#9)',
    artistHandle: '@ultravioletchorus',
    durationBeats: 4,
    voices: [
      { pitch: 'C3', midi: 48, label: 'C3', color: VOICE_PALETTE[0] },
      { pitch: 'E4', midi: 64, label: 'E4', color: VOICE_PALETTE[1] },
      { pitch: 'G4', midi: 67, label: 'G4', color: VOICE_PALETTE[2] },
      { pitch: 'Bb4', midi: 70, label: 'Bb4', color: VOICE_PALETTE[3] },
      { pitch: 'C5', midi: 72, label: 'C5', color: VOICE_PALETTE[4] },
      { pitch: 'D#5', midi: 75, label: 'D#5', color: VOICE_PALETTE[5] },
    ],
    guitarDiagram: {
      frets: ['x', 3, 2, 3, 4, 'x'],
      baseFret: 1,
      stringNotes: ['x', 'C', 'E', 'Bb', 'D#', 'x'],
    },
  },
  {
    chordName: 'Fm9',
    chordRoot: 'F',
    chordAccidental: '',
    chordExtension: 'm9',
    artistHandle: '@ultravioletchorus',
    durationBeats: 4,
    voices: [
      { pitch: 'F2', midi: 41, label: 'F2', color: VOICE_PALETTE[0] },
      { pitch: 'C4', midi: 60, label: 'C4', color: VOICE_PALETTE[1] },
      { pitch: 'Ab4', midi: 68, label: 'Ab4', color: VOICE_PALETTE[3] },
      { pitch: 'C5', midi: 72, label: 'C5', color: VOICE_PALETTE[4] },
      { pitch: 'Eb5', midi: 75, label: 'Eb5', color: VOICE_PALETTE[4] },
      { pitch: 'G5', midi: 79, label: 'G5', color: VOICE_PALETTE[5] },
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
    chordRoot: 'E',
    chordAccidental: 'b',
    chordExtension: 'm9',
    artistHandle: '@ultravioletchorus',
    durationBeats: 2,
    voices: [
      { pitch: 'Eb2', midi: 39, label: 'Eb2', color: VOICE_PALETTE[0] },
      { pitch: 'Bb3', midi: 58, label: 'Bb3', color: VOICE_PALETTE[1] },
      { pitch: 'Gb4', midi: 66, label: 'Gb4', color: VOICE_PALETTE[2] },
      { pitch: 'Bb4', midi: 70, label: 'Bb4', color: VOICE_PALETTE[3] },
      { pitch: 'Db5', midi: 73, label: 'Db5', color: VOICE_PALETTE[4] },
      { pitch: 'F5', midi: 77, label: 'F5', color: VOICE_PALETTE[5] },
    ],
    guitarDiagram: {
      frets: ['x', 6, 4, 6, 6, 'x'],
      baseFret: 4,
      barres: [{ fromString: 3, toString: 1, fret: 6 }],
      stringNotes: ['x', 'Eb', 'Gb', 'Db', 'F', 'x'],
    },
  },
  {
    chordName: 'Ab13',
    chordRoot: 'A',
    chordAccidental: 'b',
    chordExtension: '13',
    artistHandle: '@ultravioletchorus',
    durationBeats: 2,
    voices: [
      { pitch: 'Ab2', midi: 44, label: 'Ab2', color: VOICE_PALETTE[0] },
      { pitch: 'C4', midi: 60, label: 'C4', color: VOICE_PALETTE[1] },
      { pitch: 'Gb4', midi: 66, label: 'Gb4', color: VOICE_PALETTE[2] },
      { pitch: 'Bb4', midi: 70, label: 'Bb4', color: VOICE_PALETTE[3] },
      { pitch: 'C5', midi: 72, label: 'C5', color: VOICE_PALETTE[4] },
      { pitch: 'F5', midi: 77, label: 'F5', color: VOICE_PALETTE[5] },
    ],
    guitarDiagram: {
      frets: [4, 'x', 4, 5, 6, 'x'],
      baseFret: 4,
      stringNotes: ['Ab', 'x', 'Gb', 'C', 'F', 'x'],
    },
  },
  {
    chordName: 'Dbmaj7(#11)',
    chordRoot: 'D',
    chordAccidental: 'b',
    chordExtension: 'maj7(#11)',
    artistHandle: '@ultravioletchorus',
    durationBeats: 4,
    voices: [
      { pitch: 'Db3', midi: 49, label: 'Db3', color: VOICE_PALETTE[0] },
      { pitch: 'F4', midi: 65, label: 'F4', color: VOICE_PALETTE[1] },
      { pitch: 'Ab4', midi: 68, label: 'Ab4', color: VOICE_PALETTE[2] },
      { pitch: 'C5', midi: 72, label: 'C5', color: VOICE_PALETTE[3] },
      { pitch: 'Eb5', midi: 75, label: 'Eb5', color: VOICE_PALETTE[4] },
      { pitch: 'G5', midi: 79, label: 'G5', color: VOICE_PALETTE[5] },
    ],
    guitarDiagram: {
      frets: ['x', 4, 5, 5, 6, 'x'],
      baseFret: 4,
      stringNotes: ['x', 'Db', 'G', 'C', 'F', 'Ab'],
    },
  },
  {
    chordName: 'C7(b13)',
    chordRoot: 'C',
    chordAccidental: '',
    chordExtension: '7(b13)',
    artistHandle: '@ultravioletchorus',
    durationBeats: 4,
    voices: [
      { pitch: 'C3', midi: 48, label: 'C3', color: VOICE_PALETTE[0] },
      { pitch: 'E4', midi: 64, label: 'E4', color: VOICE_PALETTE[1] },
      { pitch: 'Ab4', midi: 68, label: 'Ab4', color: VOICE_PALETTE[2] },
      { pitch: 'Bb4', midi: 70, label: 'Bb4', color: VOICE_PALETTE[3] },
      { pitch: 'C5', midi: 72, label: 'C5', color: VOICE_PALETTE[4] },
      { pitch: 'D5', midi: 74, label: 'D5', color: VOICE_PALETTE[5] },
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
  bpm: number = 60,
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
 * Default mock progression matching the Swan Glide video reference (60 BPM, 24 beats).
 */
export const mockProgression: ProgressionTimeline = createProgressionTimeline(
  referenceChordSteps,
  60,
);
