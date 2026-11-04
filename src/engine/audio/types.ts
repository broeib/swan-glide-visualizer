/**
 * Arrangement track enable and disable toggles.
 */
export interface ArrangementOptions {
  /** True to include the Rhodes electric piano chords (default: true). */
  rhodes?: boolean;
  /** True to include the warm monophonic sub-bass line (default: true). */
  bass?: boolean;
  /** True to include the procedural swung lofi drum groove (default: true). */
  drums?: boolean;
  /** True to include subtle background vinyl texture (default: false). */
  vinyl?: boolean;
}

/**
 * Sound design customization parameters for multi-track synthesis.
 */
export interface SoundDesignOptions {
  /** Lowpass filter cutoff for Rhodes electric piano in Hz (default: 2200). */
  rhodesCutoff?: number;
  /** Stereophonic chorus wet mix for Rhodes (0.0 to 1.0, default: 0.25). */
  rhodesChorusWet?: number;
  /** Room reverb wet mix for Rhodes (0.0 to 1.0, default: 0.18). */
  rhodesReverbWet?: number;
  /** Sub-bass lowpass filter cutoff in Hz (default: 280). */
  bassCutoff?: number;
  /** Sub-bass volume gain multiplier (default: 0.85). */
  bassGain?: number;
  /** Drum groove swing factor (0.50 is straight, 0.58 is neo-soul pocket, default: 0.58). */
  drumSwing?: number;
  /** Drum groove master gain multiplier (default: 0.8). */
  drumGain?: number;
  /** Soft rimshot/snare room reverb wet mix (0.0 to 1.0, default: 0.22). */
  drumReverbWet?: number;
  /** Vinyl texture gain level (0.001 to 0.05, default: 0.015, ~ -36dB). */
  vinylLevel?: number;
}

/**
 * Configuration options for offline audio progression rendering.
 */
export interface OfflineAudioRenderOptions {
  /** Audio sample rate in Hz (default: 48000). */
  sampleRate?: number;
  /** PCM bit depth for WAV encoding: 16-bit or 24-bit (default: 16). */
  bitDepth?: 16 | 24;
  /** Number of audio channels: 1 (mono) or 2 (stereo, default: 2). */
  channels?: 1 | 2;
  /** Additional ring-out decay tail in seconds (default: 1.5). */
  tailSeconds?: number;
  /** Track enable/disable toggles. */
  arrangement?: ArrangementOptions;
  /** Sound design tone and mix parameters. */
  soundDesign?: SoundDesignOptions;
}

/**
 * Types of procedural drum voices in the neo-soul kit.
 */
export type DrumVoice = 'kick' | 'snare' | 'hihatClosed' | 'hihatOpen';

/**
 * Timed drum event descriptor.
 */
export interface DrumHit {
  /** Offset time in seconds from progression start. */
  timeSeconds: number;
  /** Beat offset in musical beats from progression start. */
  beat: number;
  /** Active drum voice. */
  voice: DrumVoice;
  /** Trigger velocity from 0.0 to 1.0. */
  velocity: number;
}

/**
 * Standardized audio buffer interface compatible with both Web Audio AudioBuffer
 * and headless rendering environments.
 */
export interface AudioBufferLike {
  /** Total duration of the audio in seconds. */
  duration: number;
  /** Total number of sample frames in each channel. */
  length: number;
  /** Audio sample rate in Hz (e.g. 48000). */
  sampleRate: number;
  /** Number of discrete audio channels (e.g. 2 for stereo). */
  numberOfChannels: number;
  /** Returns the Float32Array PCM samples for the specified channel index. */
  getChannelData: (channel: number) => Float32Array;
}

/**
 * Return result metadata for rendered progression audio.
 */
export interface RenderedAudioResult {
  /** Binary WAV file buffer ready for disk write or media playback. */
  wavData: Uint8Array;
  /** Total duration in seconds including reverb decay tail. */
  durationSeconds: number;
  /** Sample rate in Hz. */
  sampleRate: number;
  /** Number of channels (1 or 2). */
  channels: number;
  /** Time spent rendering in milliseconds. */
  renderTimeMs: number;
}
