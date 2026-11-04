import * as Tone from 'tone';
import { ChordStep, VoiceNote } from '../../types/music';
import { SoundDesignOptions } from './types';

/**
 * Chromatic note names mapped to pitch classes.
 */
const NOTE_NAMES = [
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
 * Converts standard MIDI note number to scientific pitch notation string (e.g. 36 -> "C2").
 */
export function midiToPitchName(midi: number): string {
  const rounded = Math.round(midi);
  const noteIndex = ((rounded % 12) + 12) % 12;
  const octave = Math.floor(rounded / 12) - 1;
  const name = NOTE_NAMES[noteIndex] ?? 'C';
  return `${name}${octave}`;
}

/**
 * Converts scientific pitch notation string to frequency in Hz (e.g. "A4" -> 440).
 */
export function pitchNameToFrequency(pitch: string): number {
  const match = /^([A-G][b#]?)(-?\d+)$/.exec(pitch);
  if (!match) {
    return 440;
  }
  const note = match[1];
  const octave = parseInt(match[2] ?? '4', 10);
  const index = NOTE_NAMES.indexOf(note as (typeof NOTE_NAMES)[number]);
  if (index === -1) {
    return 440;
  }
  const midi = (octave + 1) * 12 + index;
  return 440 * Math.pow(2, (midi - 69) / 12);
}

/**
 * Resolves the optimal sub-bass foundation pitch for a given chord step.
 *
 * Keeps sub-bass frequencies grounded in the 35 Hz to 110 Hz range (MIDI 24 to 45).
 * Transposes upper bass notes down one octave to maintain deep low-end warmth.
 */
export function resolveSubBassPitch(step: ChordStep): {
  pitch: string;
  midi: number;
  frequency: number;
} {
  const lowestVoice: VoiceNote | undefined = step.voices[0];
  let targetMidi = lowestVoice ? lowestVoice.midi : 36;

  // Drop higher bass notes down into optimal sub-bass register
  while (targetMidi > 45) {
    targetMidi -= 12;
  }
  // Lift extremely low notes that drop below audible sub-woofer threshold
  while (targetMidi < 24) {
    targetMidi += 12;
  }

  const pitch = midiToPitchName(targetMidi);
  const frequency = 440 * Math.pow(2, (targetMidi - 69) / 12);

  return { pitch, midi: targetMidi, frequency };
}

/**
 * Creates live Tone.js audio node chain for the polyphonic Rhodes electric piano.
 */
export function createToneRhodesSynth(
  options?: SoundDesignOptions,
): {
  synth: Tone.PolySynth<Tone.Synth>;
  filter: Tone.Filter;
  chorus: Tone.Chorus;
  reverb: Tone.Reverb;
  output: Tone.Volume;
} {
  const filterCutoff = options?.rhodesCutoff ?? 2200;
  const chorusWet = options?.rhodesChorusWet ?? 0.25;
  const reverbWet = options?.rhodesReverbWet ?? 0.18;

  // Polyphonic triangle synth with warm key envelope
  const synth = new Tone.PolySynth(Tone.Synth, {
    oscillator: {
      type: 'triangle',
    },
    envelope: {
      attack: 0.02,
      decay: 1.2,
      sustain: 0.4,
      release: 1.2,
    },
  });

  const filter = new Tone.Filter({
    frequency: filterCutoff,
    type: 'lowpass',
    rolloff: -12,
    Q: 1.2,
  });

  const chorus = new Tone.Chorus({
    frequency: 1.5,
    delayTime: 3.5,
    depth: 0.4,
    wet: chorusWet,
  }).start();

  const reverb = new Tone.Reverb({
    decay: 1.6,
    preDelay: 0.01,
    wet: reverbWet,
  });

  const output = new Tone.Volume(0);

  synth.chain(filter, chorus, reverb, output);

  return { synth, filter, chorus, reverb, output };
}

/**
 * Creates live Tone.js audio node chain for the warm monophonic sub-bass.
 */
export function createToneSubBassSynth(
  options?: SoundDesignOptions,
): {
  synth: Tone.MonoSynth;
  output: Tone.Volume;
} {
  const cutoff = options?.bassCutoff ?? 280;
  const gainDb = Tone.gainToDb(options?.bassGain ?? 0.85);

  const synth = new Tone.MonoSynth({
    oscillator: {
      type: 'sine',
    },
    envelope: {
      attack: 0.015,
      decay: 0.8,
      sustain: 0.7,
      release: 0.6,
    },
    filter: {
      frequency: cutoff,
      type: 'lowpass',
      rolloff: -24,
      Q: 1.0,
    },
    filterEnvelope: {
      attack: 0.02,
      decay: 0.4,
      sustain: 0.5,
      release: 0.6,
      baseFrequency: 75,
      octaves: 2.0,
    },
  });

  const output = new Tone.Volume(gainDb);
  synth.connect(output);

  return { synth, output };
}

/**
 * Creates live Tone.js drum kit synthesis nodes.
 */
export function createToneDrumKit(
  options?: SoundDesignOptions,
): {
  kick: Tone.MembraneSynth;
  snare: Tone.NoiseSynth;
  hatClosed: Tone.NoiseSynth;
  hatOpen: Tone.NoiseSynth;
  hatFilter: Tone.Filter;
  reverb: Tone.Reverb;
  output: Tone.Volume;
} {
  const gainDb = Tone.gainToDb(options?.drumGain ?? 0.82);
  const reverbWet = options?.drumReverbWet ?? 0.22;

  // Punchy membrane kick with pitch-drop envelope
  const kick = new Tone.MembraneSynth({
    pitchDecay: 0.05,
    octaves: 4.2,
    oscillator: { type: 'sine' },
    envelope: {
      attack: 0.002,
      decay: 0.36,
      sustain: 0.01,
      release: 0.35,
    },
  });

  // Soft rimshot / snare backbeat with pink noise burst
  const snare = new Tone.NoiseSynth({
    noise: { type: 'pink' },
    envelope: {
      attack: 0.003,
      decay: 0.14,
      sustain: 0.0,
      release: 0.14,
    },
  });

  // Closed hi-hat
  const hatClosed = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: 0.001,
      decay: 0.04,
      sustain: 0.0,
      release: 0.04,
    },
  });

  // Open hi-hat with extended decay
  const hatOpen = new Tone.NoiseSynth({
    noise: { type: 'white' },
    envelope: {
      attack: 0.001,
      decay: 0.18,
      sustain: 0.0,
      release: 0.18,
    },
  });

  // Highpass filter for crisp hi-hat frequencies
  const hatFilter = new Tone.Filter({
    frequency: 7200,
    type: 'highpass',
    rolloff: -12,
  });

  // Room reverb for snare and hats
  const reverb = new Tone.Reverb({
    decay: 1.4,
    preDelay: 0.01,
    wet: reverbWet,
  });

  const output = new Tone.Volume(gainDb);

  kick.connect(output);
  snare.chain(reverb, output);
  hatClosed.chain(hatFilter, output);
  hatOpen.chain(hatFilter, reverb, output);

  return { kick, snare, hatClosed, hatOpen, hatFilter, reverb, output };
}

/**
 * Creates live Tone.js vinyl atmosphere noise generator.
 */
export function createToneVinylTexture(
  options?: SoundDesignOptions,
): {
  noise: Tone.Noise;
  filter: Tone.Filter;
  output: Tone.Volume;
} {
  const level = options?.vinylLevel ?? 0.015;
  const gainDb = Tone.gainToDb(level);

  const noise = new Tone.Noise({
    type: 'pink',
  });

  const filter = new Tone.Filter({
    frequency: 950,
    type: 'lowpass',
    rolloff: -12,
    Q: 0.7,
  });

  const output = new Tone.Volume(gainDb);
  noise.chain(filter, output);

  return { noise, filter, output };
}
