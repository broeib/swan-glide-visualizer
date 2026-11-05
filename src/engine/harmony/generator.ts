import { ChordStep, StepBeatResolution } from '../../types/music';
import {
  AUTHENTIC_KEY_CENTERS,
  resolveCadenceChords,
  selectTemplate,
} from './archetypes';
import { solveGuitarChordVoicing } from './guitarVoicing';
import { isSharpKey, parseChordSymbol } from './theory';
import {
  GeneratedProgressionTimeline,
  GenerateProgressionOptions,
  MoodArchetype,
  PitchClass,
  ProgressionMetadata,
} from './types';
import { solveProgressionVoiceLeading } from './voiceLeading';

const ALL_MOODS: readonly MoodArchetype[] = [
  'dreamy-major',
  'melancholy-minor',
  'spicy-altered',
  'smooth-rnb',
] as const;

/**
 * Procedurally generates an authentic neo-soul chord progression timeline.
 */
export function generateProgression(
  options?: GenerateProgressionOptions,
): GeneratedProgressionTimeline {
  // 1. Select mood archetype
  const mood: MoodArchetype =
    options?.mood ??
    ALL_MOODS[Math.floor(Math.random() * ALL_MOODS.length)] ??
    'dreamy-major';

  // 2. Select cadence template
  const template = selectTemplate(
    mood,
    options?.chordCount,
    options?.templateId,
  );

  // 3. Select key center
  const key: PitchClass =
    options?.key ??
    AUTHENTIC_KEY_CENTERS[
      Math.floor(Math.random() * AUTHENTIC_KEY_CENTERS.length)
    ] ??
    'Db';

  // 4. Determine BPM
  const minBpm = template.tempoRange[0];
  const maxBpm = template.tempoRange[1];
  const defaultBpm = Math.round(minBpm + (maxBpm - minBpm) / 2);
  const bpm = options?.bpm !== undefined
    ? Math.max(50, Math.min(120, options.bpm))
    : defaultBpm;

  // 5. Resolve relative cadence chords to absolute chord symbols
  const resolvedChords = resolveCadenceChords(template, key);
  const preferSharps = isSharpKey(key);

  // 6. Minimal-displacement voice-leading solver
  const solverInputs = resolvedChords.map((rc) => ({
    root: rc.root,
    extension: rc.extension,
    bass: rc.bass,
  }));
  const solvedVoiceNotes = solveProgressionVoiceLeading(
    solverInputs,
    preferSharps,
  );

  // 7. Assemble ChordSteps
  const steps: ChordStep[] = resolvedChords.map((rc, idx) => {
    const parsed = parseChordSymbol(rc.chordName);
    const guitarDiagram = solveGuitarChordVoicing(rc.root, rc.extension);
    const voices = solvedVoiceNotes[idx] ?? [];

    return {
      chordName: rc.chordName,
      chordRoot: parsed.rootLetter,
      chordAccidental: parsed.accidental,
      chordExtension: rc.extension,
      artistHandle: '@ultravioletchorus',
      durationBeats: rc.durationBeats,
      voices,
      guitarDiagram,
    };
  });

  const totalBeats = steps.reduce(
    (sum, step) => sum + step.durationBeats,
    0,
  );

  const metadata: ProgressionMetadata = {
    mood,
    key,
    templateId: template.id,
    description: template.description,
    chordNames: steps.map((s) => s.chordName),
    totalBeats,
  };

  return {
    steps,
    bpm,
    metadata,
    getTotalBeats(): number {
      return this.steps.reduce((acc, step) => acc + step.durationBeats, 0);
    },
    getTotalDurationSeconds(): number {
      const beats = this.getTotalBeats();
      return (beats / this.bpm) * 60;
    },
    getStepAtBeat(beat: number): StepBeatResolution {
      const beats = this.getTotalBeats();
      if (beats <= 0 || this.steps.length === 0) {
        throw new Error('Progression has no steps or beats');
      }

      const normalizedBeat = ((beat % beats) + beats) % beats;
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
