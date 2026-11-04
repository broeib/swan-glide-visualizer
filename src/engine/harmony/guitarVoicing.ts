import { Barre, GuitarChordVoicing } from '../../types/music';
import {
  isSharpKey,
  normalizeExtensionKey,
  pitchClassToSemitone,
  semitoneToPitchClass,
} from './theory';
import { PitchClass } from './types';

/**
 * Standard guitar tuning open MIDI notes from String 6 (Low E) to String 1 (High E).
 */
export const GUITAR_OPEN_STRING_MIDIS: readonly number[] = [
  40, // String 6: E2
  45, // String 5: A2
  50, // String 4: D3
  55, // String 3: G3
  59, // String 2: B3
  64, // String 1: E4
] as const;

type FretValue = number | 'x';

/**
 * Shape definition with offsets relative to the root fret.
 */
interface ShapeDef {
  /** Root string (6 for Low E, 5 for A string). */
  rootString: 6 | 5;
  /** Relative frets from String 6 to String 1 given root fret r. */
  makeFrets: (r: number) => FretValue[];
}

/**
 * Dictionary of authentic neo-soul guitar chord shapes.
 */
const GUITAR_SHAPES: Record<string, ShapeDef[]> = {
  maj9: [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r - 1, r + 1, r, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r - 1, r, r - 1, 'x'],
    },
  ],
  maj7: [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r + 2, r + 1, r + 2, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r - 1, r, r - 2, 'x'],
    },
  ],
  'maj7(#11)': [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r + 1, r + 1, r + 2, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r - 1, r - 1, r - 2, 'x'],
    },
  ],
  '6/9': [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r - 1, r, r, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r - 1, r - 1, r - 2, 'x'],
    },
  ],
  maj13: [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r - 1, r + 1, r + 2, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r - 1, r, r + 1, 'x'],
    },
  ],
  m7: [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r + 2, r, r + 1, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r - 2, r - 2, 'x'],
    },
  ],
  m9: [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r - 2, r, r, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, r + 2, r, r, r, r + 2],
    },
  ],
  m11: [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r - 2, r - 2, r - 2, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r, r - 2, 'x'],
    },
  ],
  'min-maj7': [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r - 2, r + 1, r - 1, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r - 1, r - 1, r - 2, 'x'],
    },
  ],
  m7b5: [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r + 1, r, r + 1, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r - 1, r - 2, 'x'],
    },
  ],
  '7': [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r + 2, r, r + 2, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r + 1, r, 'x'],
    },
  ],
  '9': [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r - 1, r, r, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r + 1, r + 2, 'x'],
    },
  ],
  '13': [
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r + 1, r + 2, 'x'],
    },
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r - 1, r + 1, r + 2, 'x'],
    },
  ],
  '7(#9)': [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r - 1, r, r + 1, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r + 1, r + 2, 'x'],
    },
  ],
  '7(b13)': [
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r + 1, r + 1, r],
    },
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r + 1, r + 1, r + 2, 'x'],
    },
  ],
  '7(b9)': [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r - 1, r, r - 1, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r - 1, r - 1, 'x'],
    },
  ],
  '7(alt)': [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r - 1, r, r + 1, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r + 1, r + 1, 'x'],
    },
  ],
  'sus4(b9)': [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r + 2, r - 1, r - 1, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r, r - 1, 'x'],
    },
  ],
  '7sus4': [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r + 2, r + 2, r + 3, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r, r, r, 'x'],
    },
  ],
  dim7: [
    {
      rootString: 5,
      makeFrets: (r) => ['x', r, r + 1, r - 1, r + 1, 'x'],
    },
    {
      rootString: 6,
      makeFrets: (r) => [r, 'x', r - 1, r, r - 1, 'x'],
    },
  ],
};

/**
 * Calculates string pitch names for a frets array based on standard tuning.
 */
function calculateStringNotes(
  frets: FretValue[],
  preferSharps = false,
): string[] {
  return frets.map((fret, stringIdx) => {
    if (fret === 'x') {
      return 'x';
    }
    const openMidi = GUITAR_OPEN_STRING_MIDIS[stringIdx] ?? 40;
    const noteMidi = openMidi + fret;
    const semitone = noteMidi % 12;
    return semitoneToPitchClass(semitone, preferSharps);
  });
}

/**
 * Detects barre holds across strings for a given frets array.
 */
function detectBarres(frets: FretValue[]): Barre[] {
  // Find numerical frets that appear on multiple strings
  const fretCounts: Record<number, number[]> = {};
  for (let i = 0; i < frets.length; i++) {
    const f = frets[i];
    if (typeof f === 'number' && f > 0) {
      if (!fretCounts[f]) {
        fretCounts[f] = [];
      }
      fretCounts[f]!.push(i);
    }
  }

  const barres: Barre[] = [];

  for (const [fretStr, indices] of Object.entries(fretCounts)) {
    const fretNum = parseInt(fretStr, 10);
    if (!indices || indices.length < 2) continue;

    const minIdx = Math.min(...indices);
    const maxIdx = Math.max(...indices);

    // Check if intermediate strings are not played lower than fretNum
    let validBarre = true;
    for (let idx = minIdx; idx <= maxIdx; idx++) {
      const f = frets[idx];
      if (typeof f === 'number' && f < fretNum) {
        validBarre = false;
        break;
      }
    }

    if (validBarre) {
      // String index 0 is String 6 (low E), index 5 is String 1 (high E)
      const fromString = 6 - minIdx;
      const toString = 6 - maxIdx;
      barres.push({
        fromString,
        toString,
        fret: fretNum,
      });
    }
  }

  return barres;
}

/**
 * Solves an authentic, playable 6-string guitar chord voicing for any chord.
 */
export function solveGuitarChordVoicing(
  root: PitchClass,
  extension: string,
): GuitarChordVoicing {
  const rootSemitone = pitchClassToSemitone(root);
  const preferSharps = isSharpKey(root);
  const formulaKey = normalizeExtensionKey(extension);
  const shapes = GUITAR_SHAPES[formulaKey] ?? GUITAR_SHAPES['maj7']!;

  // String 6 open is E (semitone 4) -> root fret R6 = (root - 4) mod 12
  let r6 = ((rootSemitone - 4) % 12 + 12) % 12;
  if (r6 === 0) r6 = 12;

  // String 5 open is A (semitone 9) -> root fret R5 = (root - 9) mod 12
  let r5 = ((rootSemitone - 9) % 12 + 12) % 12;
  if (r5 === 0) r5 = 12;

  // Pick the best shape that is within playable fret range [1, 12]
  let bestFrets: FretValue[] | null = null;
  let bestScore = -Infinity;

  for (const shape of shapes) {
    const rootFret = shape.rootString === 6 ? r6 : r5;
    const frets = shape.makeFrets(rootFret);

    // Verify all frets are >= 0 and within reasonable fretboard limits
    let valid = true;
    const numFrets: number[] = [];

    for (const f of frets) {
      if (typeof f === 'number') {
        if (f < 0 || f > 16) {
          valid = false;
          break;
        }
        if (f > 0) {
          numFrets.push(f);
        }
      }
    }

    if (!valid || numFrets.length === 0) continue;

    const minF = Math.min(...numFrets);
    const maxF = Math.max(...numFrets);
    const span = maxF - minF;

    // Fret span must fit within 4 frets (playable hand reach)
    if (span > 4) continue;

    // Score based on comfortable register (frets 2 to 7 are ideal)
    let score = 20 - span * 3;
    score -= Math.abs(minF - 4) * 1.5;

    if (score > bestScore) {
      bestScore = score;
      bestFrets = frets;
    }
  }

  // Fallback if no shape matched perfectly
  if (!bestFrets) {
    const fallbackRootFret = r5 <= 8 ? r5 : r6;
    bestFrets = ['x', fallbackRootFret, fallbackRootFret + 2, fallbackRootFret + 2, fallbackRootFret + 2, 'x'];
  }

  // Calculate baseFret
  const numericalFrets = bestFrets.filter(
    (f): f is number => typeof f === 'number' && f > 0,
  );
  let baseFret = 1;
  if (numericalFrets.length > 0) {
    const minFret = Math.min(...numericalFrets);
    const maxFret = Math.max(...numericalFrets);
    if (maxFret <= 4) {
      baseFret = 1;
    } else {
      baseFret = minFret;
    }
  }

  const stringNotes = calculateStringNotes(bestFrets, preferSharps);
  const barres = detectBarres(bestFrets);

  const voicing: GuitarChordVoicing = {
    frets: bestFrets,
    baseFret,
    stringNotes,
  };

  if (barres.length > 0) {
    voicing.barres = barres;
  }

  return voicing;
}
