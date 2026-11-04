import { PitchClass } from './types';

/**
 * Ordered chromatic pitch class names using standard flat spelling.
 */
export const CHROMATIC_PITCH_CLASSES_FLAT: readonly PitchClass[] = [
  'C',
  'Db',
  'D',
  'Eb',
  'E',
  'F',
  'Gb',
  'G',
  'Ab',
  'A',
  'Bb',
  'B',
] as const;

/**
 * Ordered chromatic pitch class names using sharp spelling.
 */
export const CHROMATIC_PITCH_CLASSES_SHARP: readonly string[] = [
  'C',
  'C#',
  'D',
  'D#',
  'E',
  'F',
  'F#',
  'G',
  'G#',
  'A',
  'A#',
  'B',
] as const;

/**
 * Map of enharmonic note spellings to their semitone index (0 to 11).
 */
const NOTE_TO_SEMITONE_MAP: Record<string, number> = {
  C: 0,
  'B#': 0,
  'C#': 1,
  Db: 1,
  D: 2,
  'D#': 3,
  Eb: 3,
  E: 4,
  Fb: 4,
  'E#': 5,
  F: 5,
  'F#': 6,
  Gb: 6,
  G: 7,
  'G#': 8,
  Ab: 8,
  A: 9,
  'A#': 10,
  Bb: 10,
  B: 11,
  Cb: 11,
};

/**
 * Keys that traditionally prefer sharp accidental spelling in neo-soul and jazz.
 */
const SHARP_PREFERRING_KEYS = new Set<string>([
  'G',
  'D',
  'A',
  'E',
  'B',
  'F#',
  'C#',
]);

/**
 * Converts any note name or pitch class to its normalized semitone index (0 to 11).
 */
export function pitchClassToSemitone(pitchClass: string): number {
  const normalized = pitchClass.trim();
  const semitone = NOTE_TO_SEMITONE_MAP[normalized];
  if (semitone !== undefined) {
    return semitone;
  }
  // Fallback: extract leading letter and accidental
  const match = normalized.match(/^[A-Ga-g][b#]?/);
  if (match) {
    const raw = match[0].toUpperCase();
    const char0 = raw.charAt(0);
    const char1 = raw.charAt(1).toLowerCase();
    const formatted = raw.length > 1 ? `${char0}${char1}` : raw;
    const fallbackSemitone = NOTE_TO_SEMITONE_MAP[formatted];
    if (fallbackSemitone !== undefined) {
      return fallbackSemitone;
    }
  }
  return 0;
}

/**
 * Converts a semitone index (0 to 11) to a standard pitch class.
 */
export function semitoneToPitchClass(
  semitone: number,
  preferSharps = false,
): PitchClass {
  const normalized = ((semitone % 12) + 12) % 12;
  if (preferSharps) {
    const sharpName = CHROMATIC_PITCH_CLASSES_SHARP[normalized];
    return (sharpName ?? 'C') as PitchClass;
  }
  const flatName = CHROMATIC_PITCH_CLASSES_FLAT[normalized];
  return flatName ?? 'C';
}

/**
 * Determines whether a given key center traditionally prefers sharp spellings.
 */
export function isSharpKey(key: string): boolean {
  return SHARP_PREFERRING_KEYS.has(key);
}

/**
 * Converts a MIDI note number to scientific pitch notation (e.g. 60 to "C4", 37 to "Db2").
 */
export function midiToPitch(midi: number, preferSharps = false): string {
  const octave = Math.floor(midi / 12) - 1;
  const semitone = ((midi % 12) + 12) % 12;
  const pc = preferSharps
    ? CHROMATIC_PITCH_CLASSES_SHARP[semitone] ?? 'C'
    : CHROMATIC_PITCH_CLASSES_FLAT[semitone] ?? 'C';
  return `${pc}${octave}`;
}

/**
 * Converts a scientific pitch string (e.g. "Db2", "C4", "F#5") to its MIDI note number.
 */
export function pitchToMidi(pitch: string): number {
  const match = pitch.trim().match(/^([A-Ga-g][b#]?)(-?\d+)$/);
  if (!match || !match[1] || match[2] === undefined) {
    return 60; // Default Middle C
  }
  const notePart = match[1];
  const octavePart = parseInt(match[2], 10);
  const semitone = pitchClassToSemitone(notePart);
  return (octavePart + 1) * 12 + semitone;
}

/**
 * Extracts the octave number from a scientific pitch string.
 */
export function getPitchOctave(pitch: string): number {
  const match = pitch.trim().match(/-?\d+$/);
  return match ? parseInt(match[0], 10) : 4;
}

/**
 * Extracts the pitch class from a scientific pitch string.
 */
export function getPitchClassFromPitch(pitch: string): PitchClass {
  const match = pitch.trim().match(/^[A-Ga-g][b#]?/);
  if (!match) {
    return 'C';
  }
  const raw = match[0].toUpperCase();
  const char0 = raw.charAt(0);
  const char1 = raw.charAt(1).toLowerCase();
  const formatted = raw.length > 1 ? `${char0}${char1}` : raw;
  const semitone = pitchClassToSemitone(formatted);
  return semitoneToPitchClass(semitone);
}

/**
 * Detailed chord quality definition with interval offsets from root.
 */
export interface ChordFormula {
  /** Semitone offsets from the chord root (root = 0). */
  intervals: number[];
  /** Essential guide tones (semitones from root) that establish chord quality. */
  guideTones: number[];
  /** Characteristic color and extension tones (semitones from root). */
  colorTones: number[];
  /** Display extension string. */
  displayExtension: string;
}

/**
 * Comprehensive dictionary of neo-soul chord extension formulas.
 */
export const CHORD_FORMULAS: Record<string, ChordFormula> = {
  maj7: {
    intervals: [0, 4, 7, 11],
    guideTones: [4, 11],
    colorTones: [11],
    displayExtension: 'maj7',
  },
  maj9: {
    intervals: [0, 4, 7, 11, 14],
    guideTones: [4, 11],
    colorTones: [2, 11],
    displayExtension: 'maj9',
  },
  'maj7(#11)': {
    intervals: [0, 4, 7, 11, 14, 18],
    guideTones: [4, 11],
    colorTones: [2, 6, 11],
    displayExtension: 'maj7(#11)',
  },
  '6/9': {
    intervals: [0, 4, 7, 9, 14],
    guideTones: [4, 9],
    colorTones: [2, 9],
    displayExtension: '6/9',
  },
  maj13: {
    intervals: [0, 4, 7, 11, 14, 21],
    guideTones: [4, 11],
    colorTones: [2, 9, 11],
    displayExtension: 'maj13',
  },
  m7: {
    intervals: [0, 3, 7, 10],
    guideTones: [3, 10],
    colorTones: [10],
    displayExtension: 'm7',
  },
  m9: {
    intervals: [0, 3, 7, 10, 14],
    guideTones: [3, 10],
    colorTones: [2, 10],
    displayExtension: 'm9',
  },
  m11: {
    intervals: [0, 3, 7, 10, 14, 17],
    guideTones: [3, 10],
    colorTones: [2, 5, 10],
    displayExtension: 'm11',
  },
  'min-maj7': {
    intervals: [0, 3, 7, 11, 14],
    guideTones: [3, 11],
    colorTones: [2, 11],
    displayExtension: 'min-maj7',
  },
  'm(maj7)': {
    intervals: [0, 3, 7, 11, 14],
    guideTones: [3, 11],
    colorTones: [2, 11],
    displayExtension: 'min-maj7',
  },
  m7b5: {
    intervals: [0, 3, 6, 10, 13],
    guideTones: [3, 6, 10],
    colorTones: [1, 6],
    displayExtension: 'm7b5',
  },
  '7': {
    intervals: [0, 4, 7, 10],
    guideTones: [4, 10],
    colorTones: [10],
    displayExtension: '7',
  },
  '9': {
    intervals: [0, 4, 7, 10, 14],
    guideTones: [4, 10],
    colorTones: [2, 10],
    displayExtension: '9',
  },
  '13': {
    intervals: [0, 4, 7, 10, 14, 21],
    guideTones: [4, 10],
    colorTones: [2, 9, 10],
    displayExtension: '13',
  },
  '7(#9)': {
    intervals: [0, 4, 7, 10, 15],
    guideTones: [4, 10],
    colorTones: [3, 10],
    displayExtension: '7(#9)',
  },
  '7(b13)': {
    intervals: [0, 4, 7, 10, 20],
    guideTones: [4, 10],
    colorTones: [8, 10],
    displayExtension: '7(b13)',
  },
  '7(b9)': {
    intervals: [0, 4, 7, 10, 13],
    guideTones: [4, 10],
    colorTones: [1, 10],
    displayExtension: '7(b9)',
  },
  '7(alt)': {
    intervals: [0, 4, 10, 13, 15, 20],
    guideTones: [4, 10],
    colorTones: [1, 3, 8],
    displayExtension: '7(alt)',
  },
  'sus4(b9)': {
    intervals: [0, 5, 7, 10, 13],
    guideTones: [5, 10],
    colorTones: [1, 10],
    displayExtension: 'sus4(b9)',
  },
  '7sus4': {
    intervals: [0, 5, 7, 10, 14],
    guideTones: [5, 10],
    colorTones: [2, 10],
    displayExtension: '7sus4',
  },
  dim7: {
    intervals: [0, 3, 6, 9],
    guideTones: [3, 6, 9],
    colorTones: [3, 6, 9],
    displayExtension: 'dim7',
  },
};

/**
 * Parsed components of a chord symbol.
 */
export interface ParsedChord {
  /** Full chord symbol string. */
  full: string;
  /** Root pitch class. */
  root: PitchClass;
  /** Root letter without accidental (e.g. "D", "C", "F"). */
  rootLetter: string;
  /** Accidental character ("b", "#", or ""). */
  accidental: string;
  /** Extension symbol (e.g. "maj9", "7(#9)"). */
  extension: string;
  /** Optional bass note if an inversion is specified. */
  bass?: PitchClass;
}

/**
 * Normalizes an extension string into a canonical key in CHORD_FORMULAS.
 */
export function normalizeExtensionKey(extension: string): string {
  const trimmed = extension.trim();
  if (CHORD_FORMULAS[trimmed]) {
    return trimmed;
  }
  // Check synonyms
  if (trimmed === 'm(maj7)' || trimmed === 'mmaj7') {
    return 'min-maj7';
  }
  if (trimmed === 'M9' || trimmed === 'Maj9') {
    return 'maj9';
  }
  if (trimmed === 'M7' || trimmed === 'Maj7') {
    return 'maj7';
  }
  if (trimmed === '7#9') {
    return '7(#9)';
  }
  if (trimmed === '7b13') {
    return '7(b13)';
  }
  if (trimmed === '7b9') {
    return '7(b9)';
  }
  if (trimmed === 'min7' || trimmed === 'minor7') {
    return 'm7';
  }
  if (trimmed === 'min9' || trimmed === 'minor9') {
    return 'm9';
  }
  if (trimmed === 'min11' || trimmed === 'minor11') {
    return 'm11';
  }
  if (trimmed === 'half-dim' || trimmed === 'm7-5') {
    return 'm7b5';
  }
  return trimmed || 'maj7';
}

/**
 * Parses a chord symbol string into structured musical components.
 */
export function parseChordSymbol(chordName: string): ParsedChord {
  const trimmed = chordName.trim();
  const slashParts = trimmed.split('/');
  const mainPart = slashParts[0] ?? trimmed;
  const bassPart = slashParts[1]?.trim();

  const match = mainPart.match(/^([A-Ga-g])([b#]?)(.*)$/);
  if (!match || !match[1]) {
    return {
      full: chordName,
      root: 'C',
      rootLetter: 'C',
      accidental: '',
      extension: 'maj7',
    };
  }

  const rootLetter = match[1].toUpperCase();
  const accidental = match[2] ?? '';
  const rootString = `${rootLetter}${accidental}`;
  const semitone = pitchClassToSemitone(rootString);
  const root = semitoneToPitchClass(semitone, accidental === '#');
  const rawExtension = match[3] ?? '';
  const extension = normalizeExtensionKey(rawExtension);

  const parsed: ParsedChord = {
    full: chordName,
    root,
    rootLetter,
    accidental,
    extension,
  };

  if (bassPart) {
    const bassSemitone = pitchClassToSemitone(bassPart);
    parsed.bass = semitoneToPitchClass(bassSemitone, bassPart.includes('#'));
  }

  return parsed;
}

/**
 * Retrieves the set of pitch classes (0 to 11) for a given chord root and extension.
 */
export function getChordPitchClasses(
  root: PitchClass,
  extension: string,
): number[] {
  const rootSemitone = pitchClassToSemitone(root);
  const formulaKey = normalizeExtensionKey(extension);
  const formula = CHORD_FORMULAS[formulaKey] ?? CHORD_FORMULAS['maj7'];
  if (!formula) {
    return [rootSemitone, (rootSemitone + 4) % 12, (rootSemitone + 7) % 12];
  }

  return Array.from(
    new Set(
      formula.intervals.map((interval) => (rootSemitone + interval) % 12),
    ),
  );
}

/**
 * Transposes a chord symbol by a given number of semitones.
 */
export function transposeChord(
  chordName: string,
  semitones: number,
  preferSharps = false,
): string {
  const parsed = parseChordSymbol(chordName);
  const rootSemitone = pitchClassToSemitone(parsed.root);
  const newRootSemitone = ((rootSemitone + semitones) % 12 + 12) % 12;
  const newRoot = semitoneToPitchClass(newRootSemitone, preferSharps);

  let result = `${newRoot}${parsed.extension}`;
  if (parsed.bass) {
    const bassSemitone = pitchClassToSemitone(parsed.bass);
    const newBassSemitone = ((bassSemitone + semitones) % 12 + 12) % 12;
    const newBass = semitoneToPitchClass(newBassSemitone, preferSharps);
    result += `/${newBass}`;
  }

  return result;
}
