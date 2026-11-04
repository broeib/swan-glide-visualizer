import { VOICE_PALETTE, VoiceNote } from '../../types/music';
import {
  CHORD_FORMULAS,
  midiToPitch,
  normalizeExtensionKey,
  pitchClassToSemitone,
} from './theory';
import { PitchClass } from './types';

/**
 * Bounds for upper voice registers in scientific pitch / MIDI numbers.
 * Tenor 1, Tenor 2, Alto, Mezzo, Soprano.
 */
interface VoiceRange {
  min: number;
  max: number;
  ideal: number;
}

const UPPER_VOICE_RANGES: readonly VoiceRange[] = [
  { min: 55, max: 66, ideal: 60 }, // Tenor 1 (G3 to F#4, ideal C4)
  { min: 60, max: 71, ideal: 65 }, // Tenor 2 (C4 to B4, ideal F4)
  { min: 64, max: 75, ideal: 69 }, // Alto (E4 to Eb5, ideal A4)
  { min: 67, max: 79, ideal: 73 }, // Mezzo (G4 to G5, ideal Db5)
  { min: 71, max: 83, ideal: 77 }, // Soprano (B4 to B5, ideal F5)
] as const;

/**
 * Bass register bounds.
 */
const BASS_MIN = 36; // C2
const BASS_MAX = 49; // Db3

/**
 * Upper voicing candidate containing 5 sorted MIDI notes.
 */
interface UpperVoicingCandidate {
  notes: [number, number, number, number, number];
  intrinsicScore: number;
}

/**
 * Generates viable 5-note upper voicings for a chord.
 */
function generateUpperVoicingCandidates(
  root: PitchClass,
  extension: string,
): UpperVoicingCandidate[] {
  const rootSemitone = pitchClassToSemitone(root);
  const formulaKey = normalizeExtensionKey(extension);
  const formula = CHORD_FORMULAS[formulaKey] ?? CHORD_FORMULAS['maj7']!;

  // Collect available MIDI pitches in the overall upper register [54, 84]
  const availableTones: {
    midi: number;
    semitone: number;
    isGuide: boolean;
    isColor: boolean;
    isRoot: boolean;
  }[] = [];

  const guideSemitones = new Set(
    formula.guideTones.map((i) => (rootSemitone + i) % 12),
  );
  const colorSemitones = new Set(
    formula.colorTones.map((i) => (rootSemitone + i) % 12),
  );
  const chordSemitones = new Set(
    formula.intervals.map((i) => (rootSemitone + i) % 12),
  );

  for (let midi = 54; midi <= 84; midi++) {
    const semitone = midi % 12;
    if (chordSemitones.has(semitone)) {
      availableTones.push({
        midi,
        semitone,
        isGuide: guideSemitones.has(semitone),
        isColor: colorSemitones.has(semitone),
        isRoot: semitone === rootSemitone,
      });
    }
  }

  // Filter available pitches into register buckets for each voice
  const bucket0 = availableTones.filter(
    (t) => t.midi >= UPPER_VOICE_RANGES[0]!.min && t.midi <= UPPER_VOICE_RANGES[0]!.max,
  );
  const bucket1 = availableTones.filter(
    (t) => t.midi >= UPPER_VOICE_RANGES[1]!.min && t.midi <= UPPER_VOICE_RANGES[1]!.max,
  );
  const bucket2 = availableTones.filter(
    (t) => t.midi >= UPPER_VOICE_RANGES[2]!.min && t.midi <= UPPER_VOICE_RANGES[2]!.max,
  );
  const bucket3 = availableTones.filter(
    (t) => t.midi >= UPPER_VOICE_RANGES[3]!.min && t.midi <= UPPER_VOICE_RANGES[3]!.max,
  );
  const bucket4 = availableTones.filter(
    (t) => t.midi >= UPPER_VOICE_RANGES[4]!.min && t.midi <= UPPER_VOICE_RANGES[4]!.max,
  );

  const candidates: UpperVoicingCandidate[] = [];

  // Search combinations with voice spacing and ascending order
  for (const t0 of bucket0) {
    for (const t1 of bucket1) {
      if (t1.midi <= t0.midi) continue;
      const d01 = t1.midi - t0.midi;
      if (d01 < 1 || d01 > 9) continue;

      for (const t2 of bucket2) {
        if (t2.midi <= t1.midi) continue;
        const d12 = t2.midi - t1.midi;
        if (d12 < 1 || d12 > 9) continue;

        for (const t3 of bucket3) {
          if (t3.midi <= t2.midi) continue;
          const d23 = t3.midi - t2.midi;
          if (d23 < 1 || d23 > 9) continue;

          for (const t4 of bucket4) {
            if (t4.midi <= t3.midi) continue;
            const d34 = t4.midi - t3.midi;
            if (d34 < 1 || d34 > 9) continue;

            const totalSpan = t4.midi - t0.midi;
            if (totalSpan > 22) continue;

            // Analyze pitch coverage
            const pitchClasses = [
              t0.semitone,
              t1.semitone,
              t2.semitone,
              t3.semitone,
              t4.semitone,
            ];
            const uniquePitchClasses = new Set(pitchClasses);

            let guideCount = 0;
            let colorCount = 0;
            let rootCount = 0;

            for (const pc of uniquePitchClasses) {
              if (guideSemitones.has(pc)) guideCount++;
              if (colorSemitones.has(pc)) colorCount++;
              if (pc === rootSemitone) rootCount++;
            }

            // Neo-soul voicings require guide tones and at least one color tone
            if (guideSemitones.size > 0 && guideCount === 0) continue;

            // Score candidate voicing
            let score = 0;
            score += guideCount * 14;
            score += colorCount * 12;
            score += uniquePitchClasses.size * 8;

            // Penalize too many doubled roots in upper voices
            if (rootCount > 1) {
              score -= 8;
            }

            // Register proximity bonus
            score -= Math.abs(t0.midi - UPPER_VOICE_RANGES[0]!.ideal) * 0.5;
            score -= Math.abs(t1.midi - UPPER_VOICE_RANGES[1]!.ideal) * 0.5;
            score -= Math.abs(t2.midi - UPPER_VOICE_RANGES[2]!.ideal) * 0.5;
            score -= Math.abs(t3.midi - UPPER_VOICE_RANGES[3]!.ideal) * 0.5;
            score -= Math.abs(t4.midi - UPPER_VOICE_RANGES[4]!.ideal) * 0.5;

            // Even spacing bonus
            const avgSpacing = totalSpan / 4;
            const spacingVariance =
              Math.pow(d01 - avgSpacing, 2) +
              Math.pow(d12 - avgSpacing, 2) +
              Math.pow(d23 - avgSpacing, 2) +
              Math.pow(d34 - avgSpacing, 2);
            score -= spacingVariance * 0.2;

            candidates.push({
              notes: [t0.midi, t1.midi, t2.midi, t3.midi, t4.midi],
              intrinsicScore: score,
            });
          }
        }
      }
    }
  }

  // Sort by intrinsic score descending and take top 48 candidates
  candidates.sort((a, b) => b.intrinsicScore - a.intrinsicScore);

  if (candidates.length === 0) {
    // Robust fallback: construct standard root-3-5-7-9 voicing
    const fallbackNotes: [number, number, number, number, number] = [
      60 + rootSemitone > 65 ? 48 + rootSemitone : 60 + rootSemitone,
      64 + ((rootSemitone + 4) % 12),
      67 + ((rootSemitone + 7) % 12),
      71 + ((rootSemitone + 11) % 12),
      74 + ((rootSemitone + 14) % 12),
    ];
    fallbackNotes.sort((a, b) => a - b);
    return [{ notes: fallbackNotes, intrinsicScore: 0 }];
  }

  return candidates.slice(0, 48);
}

/**
 * Movement cost between two upper voicings.
 * Heavily prioritizes common tones and minimal semitone displacement.
 */
function calculateVoiceMovementCost(
  a: [number, number, number, number, number],
  b: [number, number, number, number, number],
): number {
  let cost = 0;
  let totalDisplacement = 0;
  let commonTones = 0;

  for (let i = 0; i < 5; i++) {
    const diff = Math.abs(b[i]! - a[i]!);
    totalDisplacement += diff;

    if (diff === 0) {
      commonTones++;
      cost += 0; // Common tone bonus
    } else if (diff === 1) {
      cost += 1.0; // Half step: very smooth
    } else if (diff === 2) {
      cost += 2.2; // Whole step: smooth
    } else if (diff === 3) {
      cost += 5.5; // Minor third
    } else if (diff === 4) {
      cost += 9.0; // Major third
    } else if (diff === 5) {
      cost += 15.0; // Perfect fourth
    } else {
      cost += 22.0 + Math.pow(diff - 5, 2) * 4.0; // Severe leap penalty
    }
  }

  // Bonus for retaining multiple common tones
  if (commonTones >= 2) {
    cost -= commonTones * 3.0;
  }

  // Penalize parallel fifths or octaves
  for (let i = 0; i < 4; i++) {
    for (let j = i + 1; j < 5; j++) {
      const intervalA = (a[j]! - a[i]!) % 12;
      const intervalB = (b[j]! - b[i]!) % 12;
      const moveI = b[i]! - a[i]!;
      const moveJ = b[j]! - a[j]!;

      if (
        (intervalA === 7 && intervalB === 7) ||
        (intervalA === 0 && intervalB === 0)
      ) {
        if (moveI !== 0 && moveI === moveJ) {
          cost += 18.0; // Parallel fifths or octaves penalty
        }
      }
    }
  }

  cost += totalDisplacement * 0.8;
  return cost;
}

/**
 * Solves Bass register placement for a chord root or inversion note.
 */
function solveBassNote(
  pitchClass: PitchClass,
  previousBassMidi?: number,
): number {
  const semitone = pitchClassToSemitone(pitchClass);

  // Generate valid bass octaves within [BASS_MIN, BASS_MAX]
  const options: number[] = [];
  for (let midi = BASS_MIN; midi <= BASS_MAX; midi++) {
    if (midi % 12 === semitone) {
      options.push(midi);
    }
  }

  if (options.length === 0) {
    return 36 + semitone;
  }

  if (previousBassMidi === undefined) {
    // Pick the option closest to the middle of the bass register (~42)
    let best = options[0]!;
    let minDiff = Math.abs(best - 42);
    for (const opt of options) {
      const diff = Math.abs(opt - 42);
      if (diff < minDiff) {
        minDiff = diff;
        best = opt;
      }
    }
    return best;
  }

  // Pick option closest to previous bass note to minimize bass leap
  let best = options[0]!;
  let minDiff = Math.abs(best - previousBassMidi);
  for (const opt of options) {
    const diff = Math.abs(opt - previousBassMidi);
    if (diff < minDiff) {
      minDiff = diff;
      best = opt;
    }
  }
  return best;
}

/**
 * Input chord definition for the voice-leading solver.
 */
export interface SolverChordInput {
  root: PitchClass;
  extension: string;
  bass?: PitchClass;
}

/**
 * Solves optimal voice leading across a sequence of chords using dynamic programming.
 * Returns an array of 6 VoiceNote objects per chord step.
 */
export function solveProgressionVoiceLeading(
  chords: SolverChordInput[],
  preferSharps = false,
): VoiceNote[][] {
  if (chords.length === 0) {
    return [];
  }

  // 1. Generate upper voicing candidates for each chord step
  const candidatesPerStep = chords.map((chord) =>
    generateUpperVoicingCandidates(chord.root, chord.extension),
  );

  const numSteps = chords.length;

  // 2. Dynamic Programming Viterbi forward pass
  // dp[step][candidateIdx] = minimal cumulative cost to reach this candidate
  const dp: number[][] = [];
  const parent: number[][] = [];

  const firstCandidates = candidatesPerStep[0]!;
  const firstStepDp: number[] = [];
  for (let c = 0; c < firstCandidates.length; c++) {
    const cand = firstCandidates[c]!;
    // Invert intrinsic score to positive penalty
    firstStepDp.push(-cand.intrinsicScore);
  }
  dp.push(firstStepDp);
  parent.push(new Array(firstCandidates.length).fill(-1));

  for (let step = 1; step < numSteps; step++) {
    const prevCandidates = candidatesPerStep[step - 1]!;
    const currCandidates = candidatesPerStep[step]!;
    const prevDp = dp[step - 1]!;

    const currDp: number[] = [];
    const currParent: number[] = [];

    for (let j = 0; j < currCandidates.length; j++) {
      const candB = currCandidates[j]!;
      let minCost = Infinity;
      let bestPrev = 0;

      for (let i = 0; i < prevCandidates.length; i++) {
        const candA = prevCandidates[i]!;
        const transitionCost = calculateVoiceMovementCost(
          candA.notes,
          candB.notes,
        );
        const total = (prevDp[i] ?? 0) + transitionCost - candB.intrinsicScore * 0.2;

        if (total < minCost) {
          minCost = total;
          bestPrev = i;
        }
      }

      currDp.push(minCost);
      currParent.push(bestPrev);
    }

    dp.push(currDp);
    parent.push(currParent);
  }

  // 3. Backtrack optimal upper voicings
  const chosenIndices: number[] = new Array(numSteps);
  const lastStepDp = dp[numSteps - 1]!;
  let bestLastIdx = 0;
  let minFinalCost = Infinity;

  for (let j = 0; j < lastStepDp.length; j++) {
    const cost = lastStepDp[j] ?? Infinity;
    if (cost < minFinalCost) {
      minFinalCost = cost;
      bestLastIdx = j;
    }
  }

  chosenIndices[numSteps - 1] = bestLastIdx;
  for (let step = numSteps - 1; step > 0; step--) {
    const currentIdx = chosenIndices[step]!;
    const prevIdx = parent[step]![currentIdx]!;
    chosenIndices[step - 1] = prevIdx;
  }

  // 4. Solve bass voice and assemble 6 VoiceNotes per step
  const result: VoiceNote[][] = [];
  let previousBassMidi: number | undefined;

  for (let step = 0; step < numSteps; step++) {
    const chord = chords[step]!;
    const bassPitchClass = chord.bass ?? chord.root;
    const bassMidi = solveBassNote(bassPitchClass, previousBassMidi);
    previousBassMidi = bassMidi;

    const candIdx = chosenIndices[step]!;
    const upperCand = candidatesPerStep[step]![candIdx]!;
    const upperNotes = upperCand.notes;

    const allMidis = [bassMidi, ...upperNotes];

    const voiceNotes: VoiceNote[] = allMidis.map((midi, voiceIndex) => {
      const pitch = midiToPitch(midi, preferSharps);
      const color: string = VOICE_PALETTE[voiceIndex] ?? VOICE_PALETTE[0];
      return {
        pitch,
        midi,
        label: pitch,
        color,
      };
    });

    result.push(voiceNotes);
  }

  return result;
}
