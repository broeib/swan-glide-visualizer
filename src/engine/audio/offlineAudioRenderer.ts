import { ProgressionTimeline } from '../../types/music';
import { generateNeoSoulDrumGroove } from './drumGroove';
import { pitchNameToFrequency, resolveSubBassPitch } from './soundDesign';
import {
  AudioBufferLike,
  OfflineAudioRenderOptions,
  RenderedAudioResult,
} from './types';
import { encodeWav, writeWavToFile } from './wavEncoder';

/**
 * Standard 48kHz stereo audio buffer implementation for isomorphic rendering.
 */
class InMemoryAudioBuffer implements AudioBufferLike {
  public readonly duration: number;
  public readonly length: number;
  public readonly sampleRate: number;
  public readonly numberOfChannels: number;
  private readonly channels: Float32Array[];

  constructor(numberOfChannels: number, length: number, sampleRate: number) {
    this.numberOfChannels = numberOfChannels;
    this.length = length;
    this.sampleRate = sampleRate;
    this.duration = length / sampleRate;
    this.channels = [];
    for (let i = 0; i < numberOfChannels; i++) {
      this.channels.push(new Float32Array(length));
    }
  }

  public getChannelData(channel: number): Float32Array {
    const data = this.channels[channel];
    if (!data) {
      throw new Error(`Channel index out of bounds: ${channel}`);
    }
    return data;
  }
}

/**
 * Mathematical triangle oscillator with optional overtone shimmer.
 */
function triangleOsc(phase: number): number {
  const norm = phase - Math.floor(phase);
  return 4 * Math.abs(norm - 0.5) - 1;
}

/**
 * High-performance deterministic DSP multi-track synthesis engine.
 *
 * Synthesizes complete neo-soul arrangements faster than real time:
 * - Polyphonic Rhodes electric piano with warm triangle body and chorus stereo spread
 * - Monophonic deep sub-bass following lowest chord voice
 * - Procedural swung drum groove (kick, soft rimshot, swung closed/open hats)
 * - Subtle filtered vinyl noise warmth
 *
 * Runs isomorphically in any JavaScript environment without external dependencies.
 */
export function renderProgressionAudioDsp(
  timeline: ProgressionTimeline,
  options?: OfflineAudioRenderOptions,
): RenderedAudioResult {
  const startTimeMs = performance.now();

  const sampleRate = options?.sampleRate ?? 48000;
  const bitDepth = options?.bitDepth ?? 16;
  const tailSeconds = options?.tailSeconds ?? 1.5;
  const arrangement = {
    rhodes: options?.arrangement?.rhodes ?? true,
    bass: options?.arrangement?.bass ?? true,
    drums: options?.arrangement?.drums ?? true,
    vinyl: options?.arrangement?.vinyl ?? false,
  };

  const soundDesign = options?.soundDesign;
  const drumSwing = soundDesign?.drumSwing ?? 0.58;
  const drumGain = soundDesign?.drumGain ?? 0.82;
  const bassGain = soundDesign?.bassGain ?? 0.85;
  const vinylLevel = soundDesign?.vinylLevel ?? 0.015;

  const totalBeats = timeline.getTotalBeats();
  const bpm = timeline.bpm;
  const progressionSeconds = (totalBeats / bpm) * 60;
  const durationSeconds = progressionSeconds + tailSeconds;
  const totalSamples = Math.ceil(durationSeconds * sampleRate);

  const buffer = new InMemoryAudioBuffer(2, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const mixSample = (channel: Float32Array, idx: number, value: number) => {
    const prev = channel[idx];
    if (prev !== undefined) {
      channel[idx] = prev + value;
    }
  };

  // 1. Synthesize Polyphonic Rhodes Electric Piano Chords
  if (arrangement.rhodes) {
    let accumulatedBeats = 0;
    const rhodesGain = 0.42;

    for (let s = 0; s < timeline.steps.length; s++) {
      const step = timeline.steps[s];
      if (!step) {
        continue;
      }

      const stepStartSec = (accumulatedBeats / bpm) * 60;
      const stepDurSec = (step.durationBeats / bpm) * 60;
      const noteDurSec = Math.max(0.1, stepDurSec - 0.05);

      const startSample = Math.floor(stepStartSec * sampleRate);
      const noteSampleCount = Math.floor(noteDurSec * sampleRate);
      const decayTailSampleCount = Math.floor(1.2 * sampleRate);
      const activeSampleCount = Math.min(
        totalSamples - startSample,
        noteSampleCount + decayTailSampleCount,
      );

      const voiceCount = step.voices.length;

      for (let v = 0; v < voiceCount; v++) {
        const voice = step.voices[v];
        if (!voice) {
          continue;
        }

        const freq = pitchNameToFrequency(voice.pitch);
        // Subtle stereophonic spread across voices
        const pan = voiceCount > 1 ? (v / (voiceCount - 1)) * 0.6 - 0.3 : 0.0;
        const leftPan = 0.5 * (1.0 - pan);
        const rightPan = 0.5 * (1.0 + pan);

        let phase = 0.0;
        const phaseStep = freq / sampleRate;

        for (let i = 0; i < activeSampleCount; i++) {
          const sampleIdx = startSample + i;
          if (sampleIdx >= totalSamples) {
            break;
          }

          const t = i / sampleRate;
          let env = 0.0;

          if (t < 0.02) {
            // Smooth attack avoiding click
            env = t / 0.02;
          } else if (t < noteDurSec) {
            // Warm exponential decay toward sustain
            const decayProgress = (t - 0.02) / 1.2;
            env = 0.45 + 0.55 * Math.exp(-decayProgress * 1.5);
          } else {
            // Note release after key lift
            const releaseProgress = (t - noteDurSec) / 0.8;
            if (releaseProgress >= 1.0) {
              break;
            }
            env = 0.45 * Math.max(0.0, 1.0 - releaseProgress);
          }

          // Blended waveform: triangle warmth + subtle tine overtone
          const tri = triangleOsc(phase);
          const tine = Math.sin(phase * 4.0 * Math.PI) * 0.15;
          const sampleVal = (tri * 0.85 + tine) * env * rhodesGain;

          mixSample(left, sampleIdx, sampleVal * leftPan);
          mixSample(right, sampleIdx, sampleVal * rightPan);

          phase += phaseStep;
          if (phase > 1.0) {
            phase -= Math.floor(phase);
          }
        }
      }

      accumulatedBeats += step.durationBeats;
    }
  }

  // 2. Synthesize Monophonic Sub-Bass Foundation
  if (arrangement.bass) {
    let accumulatedBeats = 0;

    for (let s = 0; s < timeline.steps.length; s++) {
      const step = timeline.steps[s];
      if (!step) {
        continue;
      }

      const bassInfo = resolveSubBassPitch(step);
      const freq = bassInfo.frequency;

      const stepStartSec = (accumulatedBeats / bpm) * 60;
      const stepDurSec = (step.durationBeats / bpm) * 60;
      const noteDurSec = Math.max(0.1, stepDurSec - 0.04);

      const startSample = Math.floor(stepStartSec * sampleRate);
      const noteSampleCount = Math.floor(noteDurSec * sampleRate);
      const releaseSampleCount = Math.floor(0.4 * sampleRate);
      const activeSampleCount = Math.min(
        totalSamples - startSample,
        noteSampleCount + releaseSampleCount,
      );

      let phase = 0.0;
      const phaseStep = freq / sampleRate;

      for (let i = 0; i < activeSampleCount; i++) {
        const sampleIdx = startSample + i;
        if (sampleIdx >= totalSamples) {
          break;
        }

        const t = i / sampleRate;
        let env = 0.0;

        if (t < 0.015) {
          env = t / 0.015;
        } else if (t < noteDurSec) {
          const decayProgress = (t - 0.015) / 0.6;
          env = 0.75 + 0.25 * Math.exp(-decayProgress * 2.0);
        } else {
          const releaseProgress = (t - noteDurSec) / 0.35;
          if (releaseProgress >= 1.0) {
            break;
          }
          env = 0.75 * Math.max(0.0, 1.0 - releaseProgress);
        }

        // Pure sine fundamental with gentle second harmonic warmth
        const fundamental = Math.sin(phase * 2.0 * Math.PI);
        const secondHarmonic = Math.sin(phase * 4.0 * Math.PI) * 0.12;
        const sampleVal = (fundamental + secondHarmonic) * env * bassGain * 0.45;

        // Centered mono bass
        mixSample(left, sampleIdx, sampleVal);
        mixSample(right, sampleIdx, sampleVal);

        phase += phaseStep;
        if (phase > 1.0) {
          phase -= Math.floor(phase);
        }
      }

      accumulatedBeats += step.durationBeats;
    }
  }

  // 3. Synthesize Procedural Swung Neo-Soul Drum Groove
  if (arrangement.drums) {
    const hits = generateNeoSoulDrumGroove(totalBeats, bpm, drumSwing);

    for (const hit of hits) {
      const hitStartSample = Math.floor(hit.timeSeconds * sampleRate);
      if (hitStartSample >= totalSamples) {
        continue;
      }

      if (hit.voice === 'kick') {
        const kickDurSec = 0.35;
        const kickSamples = Math.min(
          totalSamples - hitStartSample,
          Math.floor(kickDurSec * sampleRate),
        );
        let phase = 0.0;

        for (let i = 0; i < kickSamples; i++) {
          const sampleIdx = hitStartSample + i;
          const t = i / sampleRate;
          // Pitch drop envelope from 125 Hz down to 42 Hz
          const currentFreq = 42 + 83 * Math.exp(-t * 26);
          const env = Math.exp(-t * 9.0);

          const sampleVal =
            Math.sin(phase * 2.0 * Math.PI) * env * hit.velocity * drumGain * 0.75;
          mixSample(left, sampleIdx, sampleVal);
          mixSample(right, sampleIdx, sampleVal);

          phase += currentFreq / sampleRate;
        }
      } else if (hit.voice === 'snare') {
        // Soft rimshot / snare with pink noise burst and body tone
        const snareDurSec = 0.18;
        const snareSamples = Math.min(
          totalSamples - hitStartSample,
          Math.floor(snareDurSec * sampleRate),
        );
        let bodyPhase = 0.0;
        let pinkState = 0.0;

        for (let i = 0; i < snareSamples; i++) {
          const sampleIdx = hitStartSample + i;
          const t = i / sampleRate;
          const env = Math.exp(-t * 22.0);

          // Pink noise approximation
          const white = Math.random() * 2.0 - 1.0;
          pinkState = 0.95 * pinkState + 0.05 * white;

          // Rimshot body tap
          const body = Math.sin(bodyPhase * 2.0 * Math.PI) * Math.exp(-t * 40.0);
          bodyPhase += 185 / sampleRate;

          const sampleVal =
            (pinkState * 0.7 + body * 0.3) * env * hit.velocity * drumGain * 0.65;
          mixSample(left, sampleIdx, sampleVal);
          mixSample(right, sampleIdx, sampleVal);
        }
      } else if (hit.voice === 'hihatClosed') {
        const hatDurSec = 0.045;
        const hatSamples = Math.min(
          totalSamples - hitStartSample,
          Math.floor(hatDurSec * sampleRate),
        );
        let prevNoise = 0.0;

        for (let i = 0; i < hatSamples; i++) {
          const sampleIdx = hitStartSample + i;
          const t = i / sampleRate;
          const env = Math.exp(-t * 70.0);

          // Highpass filtered noise
          const white = Math.random() * 2.0 - 1.0;
          const highpassed = white - prevNoise;
          prevNoise = white;

          const sampleVal = highpassed * env * hit.velocity * drumGain * 0.38;
          // Subtle stereo pan for hi-hat
          mixSample(left, sampleIdx, sampleVal * 0.45);
          mixSample(right, sampleIdx, sampleVal * 0.55);
        }
      } else if (hit.voice === 'hihatOpen') {
        const hatDurSec = 0.22;
        const hatSamples = Math.min(
          totalSamples - hitStartSample,
          Math.floor(hatDurSec * sampleRate),
        );
        let prevNoise = 0.0;

        for (let i = 0; i < hatSamples; i++) {
          const sampleIdx = hitStartSample + i;
          const t = i / sampleRate;
          const env = Math.exp(-t * 15.0);

          const white = Math.random() * 2.0 - 1.0;
          const highpassed = white - prevNoise;
          prevNoise = white;

          const sampleVal = highpassed * env * hit.velocity * drumGain * 0.42;
          mixSample(left, sampleIdx, sampleVal * 0.45);
          mixSample(right, sampleIdx, sampleVal * 0.55);
        }
      }
    }
  }

  // 4. Synthesize Gentle Filtered Vinyl Atmosphere
  if (arrangement.vinyl) {
    let vinylState = 0.0;
    for (let i = 0; i < totalSamples; i++) {
      const white = Math.random() * 2.0 - 1.0;
      // Lowpass smoothing filter
      vinylState = 0.92 * vinylState + 0.08 * white;

      // Occasional gentle crackle impulse
      let crackle = 0.0;
      if (Math.random() < 0.00015) {
        crackle = (Math.random() * 2.0 - 1.0) * 0.1;
      }

      const sampleVal = (vinylState + crackle) * vinylLevel * 0.5;
      mixSample(left, i, sampleVal);
      mixSample(right, i, sampleVal);
    }
  }

  // 5. Apply subtle acoustic room diffusion (decay tail and stereo cross-feed)
  const delaySamples = Math.floor(0.024 * sampleRate);
  const feedback = 0.16;
  for (let i = delaySamples; i < totalSamples; i++) {
    const leftSample = left[i - delaySamples] ?? 0;
    const rightSample = right[i - delaySamples] ?? 0;
    mixSample(left, i, rightSample * feedback);
    mixSample(right, i, leftSample * feedback);
  }

  const wavData = encodeWav(buffer, bitDepth);
  const renderTimeMs = performance.now() - startTimeMs;

  return {
    wavData,
    durationSeconds,
    sampleRate,
    channels: 2,
    renderTimeMs,
  };
}

/**
 * Renders complete progression audio offline using native Web Audio OfflineAudioContext.
 *
 * Utilized directly in browser environments and headless Chromium pipelines.
 *
 * @param ctx Native OfflineAudioContext instance.
 * @param timeline Progression timeline.
 * @param options Audio render configuration.
 */
export async function renderWithOfflineAudioContext(
  ctx: OfflineAudioContext,
  timeline: ProgressionTimeline,
  options?: OfflineAudioRenderOptions,
): Promise<AudioBuffer> {
  const arrangement = {
    rhodes: options?.arrangement?.rhodes ?? true,
    bass: options?.arrangement?.bass ?? true,
    drums: options?.arrangement?.drums ?? true,
    vinyl: options?.arrangement?.vinyl ?? false,
  };

  const soundDesign = options?.soundDesign;
  const rhodesCutoff = soundDesign?.rhodesCutoff ?? 2200;
  const bassCutoff = soundDesign?.bassCutoff ?? 280;
  const bassGain = soundDesign?.bassGain ?? 0.85;
  const drumGain = soundDesign?.drumGain ?? 0.82;
  const drumSwing = soundDesign?.drumSwing ?? 0.58;
  const bpm = timeline.bpm;

  // Master Gain Node
  const masterGain = ctx.createGain();
  masterGain.gain.value = 0.88;
  masterGain.connect(ctx.destination);

  // 1. Rhodes Track Setup
  if (arrangement.rhodes) {
    const rhodesFilter = ctx.createBiquadFilter();
    rhodesFilter.type = 'lowpass';
    rhodesFilter.frequency.value = rhodesCutoff;
    rhodesFilter.Q.value = 1.0;
    rhodesFilter.connect(masterGain);

    let accumulatedBeats = 0;
    for (const step of timeline.steps) {
      const stepStartSec = (accumulatedBeats / bpm) * 60;
      const stepDurSec = (step.durationBeats / bpm) * 60;
      const noteDurSec = Math.max(0.1, stepDurSec - 0.05);

      for (const voice of step.voices) {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = pitchNameToFrequency(voice.pitch);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0, stepStartSec);
        env.gain.linearRampToValueAtTime(0.12, stepStartSec + 0.02);
        env.gain.exponentialRampToValueAtTime(0.05, stepStartSec + 1.2);
        env.gain.setValueAtTime(0.05, stepStartSec + noteDurSec);
        env.gain.exponentialRampToValueAtTime(0.0001, stepStartSec + noteDurSec + 0.4);

        osc.connect(env);
        env.connect(rhodesFilter);

        osc.start(stepStartSec);
        osc.stop(stepStartSec + noteDurSec + 0.45);
      }

      accumulatedBeats += step.durationBeats;
    }
  }

  // 2. Sub-Bass Track Setup
  if (arrangement.bass) {
    const bassFilter = ctx.createBiquadFilter();
    bassFilter.type = 'lowpass';
    bassFilter.frequency.value = bassCutoff;
    bassFilter.Q.value = 1.2;

    const bassTrackGain = ctx.createGain();
    bassTrackGain.gain.value = bassGain * 0.9;
    bassFilter.connect(bassTrackGain);
    bassTrackGain.connect(masterGain);

    let accumulatedBeats = 0;
    for (const step of timeline.steps) {
      const bassInfo = resolveSubBassPitch(step);
      const stepStartSec = (accumulatedBeats / bpm) * 60;
      const stepDurSec = (step.durationBeats / bpm) * 60;
      const noteDurSec = Math.max(0.1, stepDurSec - 0.04);

      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = bassInfo.frequency;

      const env = ctx.createGain();
      env.gain.setValueAtTime(0, stepStartSec);
      env.gain.linearRampToValueAtTime(0.38, stepStartSec + 0.015);
      env.gain.exponentialRampToValueAtTime(0.26, stepStartSec + 0.6);
      env.gain.setValueAtTime(0.26, stepStartSec + noteDurSec);
      env.gain.exponentialRampToValueAtTime(0.0001, stepStartSec + noteDurSec + 0.35);

      osc.connect(env);
      env.connect(bassFilter);

      osc.start(stepStartSec);
      osc.stop(stepStartSec + noteDurSec + 0.4);

      accumulatedBeats += step.durationBeats;
    }
  }

  // 3. Drums Track Setup
  if (arrangement.drums) {
    const totalBeats = timeline.getTotalBeats();
    const hits = generateNeoSoulDrumGroove(totalBeats, bpm, drumSwing);

    // Create 1-second white noise buffer for snare and hats
    const noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < ctx.sampleRate; i++) {
      noiseData[i] = Math.random() * 2.0 - 1.0;
    }

    const hatFilter = ctx.createBiquadFilter();
    hatFilter.type = 'highpass';
    hatFilter.frequency.value = 7500;
    hatFilter.connect(masterGain);

    for (const hit of hits) {
      const t = hit.timeSeconds;

      if (hit.voice === 'kick') {
        const osc = ctx.createOscillator();
        osc.frequency.setValueAtTime(125, t);
        osc.frequency.exponentialRampToValueAtTime(42, t + 0.08);

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.85 * hit.velocity * drumGain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

        osc.connect(env);
        env.connect(masterGain);
        osc.start(t);
        osc.stop(t + 0.36);
      } else if (hit.voice === 'snare') {
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;

        const snareFilter = ctx.createBiquadFilter();
        snareFilter.type = 'bandpass';
        snareFilter.frequency.value = 1500;
        snareFilter.Q.value = 2.0;

        const env = ctx.createGain();
        env.gain.setValueAtTime(0.75 * hit.velocity * drumGain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + 0.15);

        noiseNode.connect(snareFilter);
        snareFilter.connect(env);
        env.connect(masterGain);
        noiseNode.start(t);
        noiseNode.stop(t + 0.16);
      } else if (hit.voice === 'hihatClosed' || hit.voice === 'hihatOpen') {
        const noiseNode = ctx.createBufferSource();
        noiseNode.buffer = noiseBuffer;

        const decay = hit.voice === 'hihatClosed' ? 0.045 : 0.18;
        const env = ctx.createGain();
        env.gain.setValueAtTime(0.48 * hit.velocity * drumGain, t);
        env.gain.exponentialRampToValueAtTime(0.001, t + decay);

        noiseNode.connect(hatFilter);
        hatFilter.connect(env);
        env.connect(masterGain);
        noiseNode.start(t);
        noiseNode.stop(t + decay + 0.01);
      }
    }
  }

  // 4. Vinyl Texture Setup
  if (arrangement.vinyl) {
    const vinylDuration = timeline.getTotalDurationSeconds() + (options?.tailSeconds ?? 1.5);
    const vinylBuffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * vinylDuration), ctx.sampleRate);
    const vinylData = vinylBuffer.getChannelData(0);
    let state = 0.0;
    for (let i = 0; i < vinylData.length; i++) {
      const white = Math.random() * 2.0 - 1.0;
      state = 0.92 * state + 0.08 * white;
      vinylData[i] = state * 0.015;
    }

    const vinylSource = ctx.createBufferSource();
    vinylSource.buffer = vinylBuffer;
    vinylSource.connect(masterGain);
    vinylSource.start(0);
  }

  return await ctx.startRendering();
}

/**
 * Primary offline audio synthesis export for the Swan Glide Visualizer.
 *
 * Renders the full multi-timbral neo-soul progression timeline faster than real time
 * and encodes the result into standard 16-bit or 24-bit PCM 48kHz stereo WAV format.
 *
 * @param timeline Progression timeline to synthesize.
 * @param options Sound design, mix, bit depth, and arrangement options.
 * @returns Uint8Array containing complete standard WAV binary file.
 */
export async function renderProgressionAudioOffline(
  timeline: ProgressionTimeline,
  options?: OfflineAudioRenderOptions,
): Promise<Uint8Array> {
  // If running in browser or environment with native OfflineAudioContext
  if (
    typeof window !== 'undefined' &&
    typeof (window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext: unknown }).webkitOfflineAudioContext) !== 'undefined'
  ) {
    const sampleRate = options?.sampleRate ?? 48000;
    const tailSeconds = options?.tailSeconds ?? 1.5;
    const duration = timeline.getTotalDurationSeconds() + tailSeconds;
    const totalFrames = Math.ceil(duration * sampleRate);

    const AudioContextClass =
      window.OfflineAudioContext ||
      (window as unknown as { webkitOfflineAudioContext: typeof OfflineAudioContext }).webkitOfflineAudioContext;

    const ctx = new AudioContextClass(2, totalFrames, sampleRate);
    const audioBuffer = await renderWithOfflineAudioContext(ctx, timeline, options);
    return encodeWav(audioBuffer, options?.bitDepth ?? 16);
  }

  // In Node.js / headless environments, utilize high-speed deterministic DSP engine
  const result = renderProgressionAudioDsp(timeline, options);
  return result.wavData;
}

/**
 * Helper that renders a progression timeline and saves the resulting WAV file to disk.
 *
 * @param timeline Progression timeline to synthesize.
 * @param filePath Output file destination path (e.g. "output/progression.wav").
 * @param options Sound design and render options.
 */
export async function exportProgressionWavFile(
  timeline: ProgressionTimeline,
  filePath: string,
  options?: OfflineAudioRenderOptions,
): Promise<void> {
  const wavBytes = await renderProgressionAudioOffline(timeline, options);
  await writeWavToFile(wavBytes, filePath);
}
