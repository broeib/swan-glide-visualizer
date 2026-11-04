import fs from 'fs';
import { ChordStep, ProgressionTimeline } from '../types/music';

/**
 * Configuration options for offline audio synthesis.
 */
export interface AudioSynthOptions {
  /** Target sample rate in Hz (default: 48000). */
  sampleRate?: number;
  /** Master volume gain (0.0 to 1.0, default: 0.85). */
  volume?: number;
  /** Optional reference MP3 path to decode or use directly. */
  referenceAudioPath?: string;
}

/**
 * Writes standard 16-bit stereo PCM WAV header and data.
 */
export function createWavBuffer(
  leftChannel: Float32Array,
  rightChannel: Float32Array,
  sampleRate: number = 48000
): Buffer {
  const numSamples = leftChannel.length;
  const numChannels = 2;
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // Sub-chunk 1 (fmt )
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Sub-chunk size
  buffer.writeUInt16LE(1, 20); // Audio format 1 = PCM
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(16, 34); // Bits per sample

  // Sub-chunk 2 (data)
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Interleave left and right channels
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const s0 = Math.max(-1, Math.min(1, leftChannel[i] || 0));
    const s1 = Math.max(-1, Math.min(1, rightChannel[i] || 0));
    buffer.writeInt16LE(s0 < 0 ? Math.round(s0 * 0x8000) : Math.round(s0 * 0x7fff), offset);
    buffer.writeInt16LE(s1 < 0 ? Math.round(s1 * 0x8000) : Math.round(s1 * 0x7fff), offset + 2);
    offset += 4;
  }

  return buffer;
}

/**
 * Offline Rhode/Analog Electric Piano synthesizer implemented in pure TypeScript.
 * Renders studio-quality 48kHz stereo WAV without audio device dependencies.
 */
export function synthesizeProgressionWav(
  progression: ProgressionTimeline,
  options: AudioSynthOptions = {}
): Buffer {
  const sampleRate = options.sampleRate ?? 48000;
  const masterVolume = options.volume ?? 0.85;
  const bpm = progression.bpm || 60;
  const totalBeats = progression.getTotalBeats();
  const totalDurationSeconds = (totalBeats / bpm) * 60;
  const totalSamples = Math.ceil(totalDurationSeconds * sampleRate);

  const leftChannel = new Float32Array(totalSamples);
  const rightChannel = new Float32Array(totalSamples);

  let currentBeat = 0;

  for (let stepIdx = 0; stepIdx < progression.steps.length; stepIdx++) {
    const step: ChordStep = progression.steps[stepIdx]!;
    const startSec = (currentBeat / bpm) * 60;
    const durSec = (step.durationBeats / bpm) * 60;
    const startSample = Math.floor(startSec * sampleRate);
    const durSamples = Math.floor(durSec * sampleRate);

    // Synthesize each voice note in the chord step
    for (let voiceIdx = 0; voiceIdx < step.voices.length; voiceIdx++) {
      const voice = step.voices[voiceIdx]!;
      const midi = voice.midi;
      const freq = 440 * Math.pow(2, (midi - 69) / 12);

      // Stereo pan based on voice register
      // Bass center, tenors slightly left/right, soprano wide right
      const pan = -0.3 + (voiceIdx / (step.voices.length - 1 || 1)) * 0.6;
      const leftGain = Math.cos((pan + 1) * Math.PI * 0.25);
      const rightGain = Math.sin((pan + 1) * Math.PI * 0.25);

      const isBass = voiceIdx === 0;
      const voiceAmp = isBass ? 0.32 : 0.18;

      for (let s = 0; s < durSamples; s++) {
        const outIdx = startSample + s;
        if (outIdx >= totalSamples) break;

        const t = s / sampleRate;

        // Envelope: quick 20ms attack, gentle exponential decay
        let env = 1.0;
        if (t < 0.02) {
          env = t / 0.02;
        } else {
          env = Math.exp(-2.2 * (t - 0.02)) * 0.55 + Math.exp(-0.35 * (t - 0.02)) * 0.45;
        }

        // Release at end of step
        const releaseTime = durSec - t;
        if (releaseTime < 0.04) {
          env *= Math.max(0, releaseTime / 0.04);
        }

        // Triangle body with gentle sine overtone and subtle chorus detune
        const phase1 = 2 * Math.PI * freq * t;
        const phase2 = 2 * Math.PI * freq * 2.002 * t; // subtle second harmonic detune
        const tri = (2 / Math.PI) * Math.asin(Math.sin(phase1));
        const sine = Math.sin(phase2);

        // Sub-bass reinforcement on the root note
        const sub = isBass ? 0.4 * Math.sin(2 * Math.PI * (freq * 0.5) * t) : 0;

        const sample = (tri * 0.75 + sine * 0.25 + sub) * env * voiceAmp * masterVolume;

        leftChannel[outIdx] = (leftChannel[outIdx] || 0) + sample * leftGain;
        rightChannel[outIdx] = (rightChannel[outIdx] || 0) + sample * rightGain;
      }
    }

    currentBeat += step.durationBeats;
  }

  return createWavBuffer(leftChannel, rightChannel, sampleRate);
}

/**
 * Extracts 48kHz audio from Puppeteer page if available, falling back to pure TypeScript synthesis.
 */
export async function generate48kHzAudio(
  page: any,
  progression: ProgressionTimeline,
  outputPath: string,
  sampleRate: number = 48000
): Promise<string> {
  try {
    if (page) {
      const b64 = await page.evaluate((sr: number) => {
        if (typeof (window as any).renderAudio === 'function') {
          return (window as any).renderAudio(sr);
        }
        return null;
      }, sampleRate);

      if (b64 && typeof b64 === 'string') {
        const buf = Buffer.from(b64, 'base64');
        fs.writeFileSync(outputPath, buf);
        return outputPath;
      }
    }
  } catch (err) {
    console.warn('Browser OfflineAudioContext render had warning, using offline synthesizer:', err);
  }

  // Standalone offline synthesis fallback
  const wavBuf = synthesizeProgressionWav(progression, { sampleRate });
  fs.writeFileSync(outputPath, wavBuf);
  return outputPath;
}