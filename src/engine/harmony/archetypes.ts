import {
  isSharpKey,
  pitchClassToSemitone,
  semitoneToPitchClass,
} from './theory';
import {
  CadenceChordSpec,
  CadenceTemplate,
  MoodArchetype,
  PitchClass,
} from './types';

/**
 * Authentic default key centers favoured in neo-soul productions.
 */
export const AUTHENTIC_KEY_CENTERS: readonly PitchClass[] = [
  'Db',
  'Ab',
  'Eb',
  'Bb',
  'F',
  'C',
  'G',
] as const;

/**
 * Curated cadence templates for 'dreamy-major'.
 */
const DREAMY_MAJOR_TEMPLATES: CadenceTemplate[] = [
  {
    id: 'dreamy-lydian-glow',
    name: 'Lydian Blossom',
    mood: 'dreamy-major',
    description: 'Floating major 9th and Lydian #11 extensions with tender step-wise descents.',
    tempoRange: [60, 70],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 5, role: 'IVmaj7(#11)', extension: 'maj7(#11)', durationBeats: 4 },
      { rootOffset: 4, role: 'iii7', extension: 'm7', durationBeats: 4 },
      { rootOffset: 9, role: 'vi9', extension: 'm9', durationBeats: 4 },
    ],
  },
  {
    id: 'dreamy-floating-extensions',
    name: 'Floating Extensions',
    mood: 'dreamy-major',
    description: 'Luminous tonic major ninth ascending into sweet secondary dominants and Lydian shimmer.',
    tempoRange: [62, 72],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 2, role: 'ii9', extension: 'm9', durationBeats: 2 },
      { rootOffset: 7, role: 'V13', extension: '13', durationBeats: 2 },
      { rootOffset: 4, role: 'iii7', extension: 'm7', durationBeats: 4 },
      { rootOffset: 5, role: 'IVmaj7(#11)', extension: 'maj7(#11)', durationBeats: 4 },
    ],
  },
  {
    id: 'dreamy-celestial-ascent',
    name: 'Celestial 24-Beat Ascent',
    mood: 'dreamy-major',
    description: 'Expansive 6-chord major narrative featuring lush 9ths and soaring 13th cadences.',
    tempoRange: [60, 68],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 5, role: 'IVmaj7(#11)', extension: 'maj7(#11)', durationBeats: 4 },
      { rootOffset: 4, role: 'iii9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 9, role: 'vi9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 2, role: 'ii9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 7, role: 'V13', extension: '13', durationBeats: 4 },
    ],
  },
  {
    id: 'dreamy-pentatonic-blossom',
    name: 'Pentatonic 6/9 Blossom',
    mood: 'dreamy-major',
    description: 'Airy 6/9 voicings meeting modal subtonic exchanges and sparkling upper extensions.',
    tempoRange: [64, 72],
    chords: [
      { rootOffset: 0, role: 'I6/9', extension: '6/9', durationBeats: 4 },
      { rootOffset: 5, role: 'IVmaj7(#11)', extension: 'maj7(#11)', durationBeats: 4 },
      { rootOffset: 10, role: 'bVIImaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
    ],
  },
  {
    id: 'dreamy-aurora-glide',
    name: 'Aurora 8-Chord Glide',
    mood: 'dreamy-major',
    description: 'Gentle 8-chord waltz of major ninths, sharp elevens, and resolving 6/9 sonorities.',
    tempoRange: [60, 70],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 3 },
      { rootOffset: 2, role: 'ii9', extension: 'm9', durationBeats: 3 },
      { rootOffset: 4, role: 'iii7', extension: 'm7', durationBeats: 3 },
      { rootOffset: 5, role: 'IVmaj7(#11)', extension: 'maj7(#11)', durationBeats: 3 },
      { rootOffset: 9, role: 'vi9', extension: 'm9', durationBeats: 3 },
      { rootOffset: 7, role: 'V13', extension: '13', durationBeats: 3 },
      { rootOffset: 5, role: 'IVmaj9', extension: 'maj9', durationBeats: 3 },
      { rootOffset: 0, role: 'I6/9', extension: '6/9', durationBeats: 3 },
    ],
  },
];

/**
 * Curated cadence templates for 'melancholy-minor'.
 */
const MELANCHOLY_MINOR_TEMPLATES: CadenceTemplate[] = [
  {
    id: 'minor-line-cliche',
    name: 'Minor Line Cliche',
    mood: 'melancholy-minor',
    description: 'Classic descending chromatic inner voice moving through minor 9th, minor-major 7th, and minor 7th.',
    tempoRange: [60, 70],
    chords: [
      { rootOffset: 0, role: 'im9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 0, role: 'im(maj7)', extension: 'min-maj7', durationBeats: 4 },
      { rootOffset: 0, role: 'im7', extension: 'm7', durationBeats: 4 },
      { rootOffset: 5, role: 'iv9', extension: 'm9', durationBeats: 4 },
    ],
  },
  {
    id: 'minor-dark-soul-walkdown',
    name: 'Dark Soul Walkdown',
    mood: 'melancholy-minor',
    description: 'Somber minor 9th opening into submediant major and resolving through half-diminished tension.',
    tempoRange: [60, 72],
    chords: [
      { rootOffset: 0, role: 'im9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 8, role: 'bVImaj7', extension: 'maj7', durationBeats: 4 },
      { rootOffset: 2, role: 'iim7b5', extension: 'm7b5', durationBeats: 4 },
      { rootOffset: 7, role: 'V7(b13)', extension: '7(b13)', durationBeats: 4 },
    ],
  },
  {
    id: 'minor-odyssey-extended',
    name: 'Minor Odyssey 24-Beat',
    mood: 'melancholy-minor',
    description: 'Deep emotive minor voyage flowing through rich m11 chords and altered dominant turnarounds.',
    tempoRange: [60, 68],
    chords: [
      { rootOffset: 0, role: 'im11', extension: 'm11', durationBeats: 4 },
      { rootOffset: 5, role: 'iv9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 10, role: 'bVII13', extension: '13', durationBeats: 4 },
      { rootOffset: 3, role: 'bIIImaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 2, role: 'iim7b5', extension: 'm7b5', durationBeats: 4 },
      { rootOffset: 7, role: 'V7(b13)', extension: '7(b13)', durationBeats: 4 },
    ],
  },
  {
    id: 'minor-introspective-glow',
    name: 'Introspective Glow',
    mood: 'melancholy-minor',
    description: 'Tender minor 9th and 11th voicings enriched by Lydian submediant and altered dominant colors.',
    tempoRange: [62, 72],
    chords: [
      { rootOffset: 0, role: 'im9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 5, role: 'iv11', extension: 'm11', durationBeats: 4 },
      { rootOffset: 8, role: 'bVImaj7(#11)', extension: 'maj7(#11)', durationBeats: 4 },
      { rootOffset: 2, role: 'iim7b5', extension: 'm7b5', durationBeats: 3 },
      { rootOffset: 7, role: 'V7(b13)', extension: '7(b13)', durationBeats: 3 },
    ],
  },
  {
    id: 'minor-somber-tapestry',
    name: 'Somber Tapestry 7-Step',
    mood: 'melancholy-minor',
    description: 'Detailed chromatic voice shifts across 7 expressive chords concluding in an expansive minor 11th.',
    tempoRange: [60, 70],
    chords: [
      { rootOffset: 0, role: 'im9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 0, role: 'im(maj7)', extension: 'min-maj7', durationBeats: 2 },
      { rootOffset: 0, role: 'im7', extension: 'm7', durationBeats: 2 },
      { rootOffset: 5, role: 'iv9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 2, role: 'iim7b5', extension: 'm7b5', durationBeats: 2 },
      { rootOffset: 7, role: 'V7(b13)', extension: '7(b13)', durationBeats: 2 },
      { rootOffset: 0, role: 'im11', extension: 'm11', durationBeats: 4 },
    ],
  },
];

/**
 * Curated cadence templates for 'spicy-altered'.
 */
const SPICY_ALTERED_TEMPLATES: CadenceTemplate[] = [
  {
    id: 'spicy-swan-glide-signature',
    name: 'Swan Glide Signature Altered Progression',
    mood: 'spicy-altered',
    description: 'The authentic Swan Glide reference cadence featuring Hendrix 7(#9), 7(b13), and Lydian #11 shifts.',
    tempoRange: [60, 68],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 11, role: 'VII7(#9)', extension: '7(#9)', durationBeats: 4 },
      { rootOffset: 4, role: 'IIIm9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 2, role: 'IIm9', extension: 'm9', durationBeats: 2 },
      { rootOffset: 7, role: 'V13', extension: '13', durationBeats: 2 },
      { rootOffset: 0, role: 'Imaj7(#11)', extension: 'maj7(#11)', durationBeats: 4 },
      { rootOffset: 11, role: 'VII7(b13)', extension: '7(b13)', durationBeats: 4 },
    ],
  },
  {
    id: 'spicy-tritone-sub-chain',
    name: 'Tritone Substitution Chain',
    mood: 'spicy-altered',
    description: 'Sophisticated chromatic substitutions inserting altered dominants a half-step above target chords.',
    tempoRange: [60, 72],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 3, role: 'subV7/ii [bIII7(#9)]', extension: '7(#9)', durationBeats: 4 },
      { rootOffset: 2, role: 'ii9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 1, role: 'subV7 [bII7(b13)]', extension: '7(b13)', durationBeats: 4 },
    ],
  },
  {
    id: 'spicy-altered-turnaround',
    name: 'Altered Turnaround Matrix',
    mood: 'spicy-altered',
    description: 'Crisp minor ninth entering half-step altered substitutions and resolving into a lush tonic.',
    tempoRange: [62, 74],
    chords: [
      { rootOffset: 2, role: 'iim9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 1, role: 'subV7 [bII7(#9)]', extension: '7(#9)', durationBeats: 4 },
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 9, role: 'VI7(b13)', extension: '7(b13)', durationBeats: 2 },
      { rootOffset: 3, role: 'subV7/ii', extension: '7(#9)', durationBeats: 2 },
    ],
  },
  {
    id: 'spicy-chromatic-tension',
    name: 'Chromatic Tension & Release',
    mood: 'spicy-altered',
    description: 'High-tension altered dominants cycling through altered extensions before settling into Lydian peace.',
    tempoRange: [60, 70],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 9, role: 'VI7(#9)', extension: '7(#9)', durationBeats: 4 },
      { rootOffset: 2, role: 'ii9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 7, role: 'V7(alt)', extension: '7(alt)', durationBeats: 2 },
      { rootOffset: 1, role: 'subV7 [bII7(b13)]', extension: '7(b13)', durationBeats: 4 },
      { rootOffset: 0, role: 'Imaj7(#11)', extension: 'maj7(#11)', durationBeats: 4 },
    ],
  },
  {
    id: 'spicy-gospel-crunch',
    name: 'Gospel Crunch 8-Step',
    mood: 'spicy-altered',
    description: 'Energetic 8-chord sequence bursting with altered fifths, sharp ninths, and half-step resolutions.',
    tempoRange: [64, 76],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 3 },
      { rootOffset: 3, role: 'subV7/ii', extension: '7(#9)', durationBeats: 3 },
      { rootOffset: 2, role: 'ii9', extension: 'm9', durationBeats: 3 },
      { rootOffset: 7, role: 'V7(#9)', extension: '7(#9)', durationBeats: 3 },
      { rootOffset: 4, role: 'IIIm9', extension: 'm9', durationBeats: 3 },
      { rootOffset: 9, role: 'VI7(b13)', extension: '7(b13)', durationBeats: 3 },
      { rootOffset: 2, role: 'iim9', extension: 'm9', durationBeats: 3 },
      { rootOffset: 1, role: 'subV7', extension: '7(b13)', durationBeats: 3 },
    ],
  },
];

/**
 * Curated cadence templates for 'smooth-rnb'.
 */
const SMOOTH_RNB_TEMPLATES: CadenceTemplate[] = [
  {
    id: 'rnb-backdoor-resolution',
    name: 'Backdoor Cadence Signature',
    mood: 'smooth-rnb',
    description: 'Iconic neo-soul minor iv to flat-seven thirteen backdoor resolution into a velvety tonic major.',
    tempoRange: [64, 76],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 5, role: 'iv9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 10, role: 'bVII13', extension: '13', durationBeats: 4 },
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
    ],
  },
  {
    id: 'rnb-velvet-gospel-turnaround',
    name: 'Velvet Gospel Turnaround',
    mood: 'smooth-rnb',
    description: 'Soulful two-five-one dressed in smooth thirteenths and warm secondary dominant inflections.',
    tempoRange: [65, 78],
    chords: [
      { rootOffset: 2, role: 'ii9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 7, role: 'V13', extension: '13', durationBeats: 4 },
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 9, role: 'VI7(#9)', extension: '7(#9)', durationBeats: 4 },
    ],
  },
  {
    id: 'rnb-passing-chord-glide',
    name: 'Chromatic Passing Flow',
    mood: 'smooth-rnb',
    description: 'Silky progression gliding between major 9ths and chromatic mediant approach chords.',
    tempoRange: [62, 75],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 3, role: 'bIIImaj9', extension: 'maj9', durationBeats: 2 },
      { rootOffset: 2, role: 'ii9', extension: 'm9', durationBeats: 2 },
      { rootOffset: 7, role: 'V13', extension: '13', durationBeats: 4 },
      { rootOffset: 5, role: 'iv9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
    ],
  },
  {
    id: 'rnb-erykah-soul-circle',
    name: 'Soul Circle 24-Beat',
    mood: 'smooth-rnb',
    description: 'Laid-back six-chord cycle echoing vintage Erykah Badu and DAngelo grooves.',
    tempoRange: [62, 72],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 5, role: 'IVmaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 4, role: 'iii7', extension: 'm7', durationBeats: 4 },
      { rootOffset: 9, role: 'vi9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 2, role: 'ii9', extension: 'm9', durationBeats: 4 },
      { rootOffset: 7, role: 'V13', extension: '13', durationBeats: 4 },
    ],
  },
  {
    id: 'rnb-dangelo-groove',
    name: 'DAngelo Velvet Groove',
    mood: 'smooth-rnb',
    description: 'Deep Rhodes groove coupling a minor 11th iv chord with a bVII13 dominant push.',
    tempoRange: [65, 80],
    chords: [
      { rootOffset: 0, role: 'Imaj9', extension: 'maj9', durationBeats: 4 },
      { rootOffset: 5, role: 'iv11', extension: 'm11', durationBeats: 4 },
      { rootOffset: 10, role: 'bVII13', extension: '13', durationBeats: 4 },
      { rootOffset: 2, role: 'ii9', extension: 'm9', durationBeats: 3 },
      { rootOffset: 7, role: 'V7(b13)', extension: '7(b13)', durationBeats: 3 },
    ],
  },
];

/**
 * Master catalog mapping mood archetypes to their curated cadence templates.
 */
export const ARCHETYPE_TEMPLATES: Record<MoodArchetype, CadenceTemplate[]> = {
  'dreamy-major': DREAMY_MAJOR_TEMPLATES,
  'melancholy-minor': MELANCHOLY_MINOR_TEMPLATES,
  'spicy-altered': SPICY_ALTERED_TEMPLATES,
  'smooth-rnb': SMOOTH_RNB_TEMPLATES,
};

/**
 * Returns all templates registered for a given mood archetype.
 */
export function getArchetypeTemplates(mood: MoodArchetype): CadenceTemplate[] {
  return ARCHETYPE_TEMPLATES[mood] ?? DREAMY_MAJOR_TEMPLATES;
}

/**
 * Selects an optimal cadence template for the requested mood and chord count.
 */
export function selectTemplate(
  mood: MoodArchetype,
  targetChordCount?: number,
): CadenceTemplate {
  const templates = getArchetypeTemplates(mood);
  if (templates.length === 0) {
    const fallback = DREAMY_MAJOR_TEMPLATES[0];
    if (!fallback) {
      throw new Error('No cadence templates available');
    }
    return fallback;
  }

  if (targetChordCount !== undefined) {
    // Find an exact match if possible
    const exactMatch = templates.find(
      (tpl) => tpl.chords.length === targetChordCount,
    );
    if (exactMatch) {
      return exactMatch;
    }

    // Otherwise find closest match
    let closest = templates[0];
    if (!closest) {
      throw new Error('Templates array is empty');
    }
    let minDiff = Math.abs(closest.chords.length - targetChordCount);

    for (const tpl of templates) {
      const diff = Math.abs(tpl.chords.length - targetChordCount);
      if (diff < minDiff) {
        minDiff = diff;
        closest = tpl;
      }
    }
    return closest;
  }

  // Random selection if no specific count requested
  const randomIndex = Math.floor(Math.random() * templates.length);
  const selected = templates[randomIndex];
  if (!selected) {
    const fallback = templates[0];
    if (!fallback) {
      throw new Error('Templates array is empty');
    }
    return fallback;
  }
  return selected;
}

/**
 * Resolved chord step with absolute chord symbol and duration.
 */
export interface ResolvedCadenceStep {
  chordName: string;
  root: PitchClass;
  extension: string;
  durationBeats: number;
  role: string;
  bass?: PitchClass;
}

/**
 * Resolves relative cadence chords to absolute chord symbols for a target key center.
 */
export function resolveCadenceChords(
  template: CadenceTemplate,
  key: PitchClass,
): ResolvedCadenceStep[] {
  const keySemitone = pitchClassToSemitone(key);
  const preferSharps = isSharpKey(key);

  return template.chords.map((chordSpec: CadenceChordSpec) => {
    const chordSemitone = (keySemitone + chordSpec.rootOffset) % 12;
    const root = semitoneToPitchClass(chordSemitone, preferSharps);
    const chordName = `${root}${chordSpec.extension}`;

    let bass: PitchClass | undefined;
    if (chordSpec.bassOffset !== undefined) {
      const bassSemitone = (keySemitone + chordSpec.bassOffset) % 12;
      bass = semitoneToPitchClass(bassSemitone, preferSharps);
    }

    return {
      chordName: bass ? `${chordName}/${bass}` : chordName,
      root,
      extension: chordSpec.extension,
      durationBeats: chordSpec.durationBeats,
      role: chordSpec.role,
      bass,
    };
  });
}
