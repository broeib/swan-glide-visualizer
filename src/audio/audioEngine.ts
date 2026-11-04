import * as Tone from 'tone';
import { generateNeoSoulDrumGroove } from '../engine/audio/drumGroove';
import { resolveSubBassPitch } from '../engine/audio/soundDesign';
import { ChordStep, ProgressionTimeline } from '../types/music';

/**
 * Playback state emitted to subscribers.
 */
export interface AudioPlaybackState {
  /** True when audio playback is actively running. */
  isPlaying: boolean;
  /** Normalized progression progress from 0.0 to 1.0. */
  progress: number;
  /** Zero-based index of the currently active chord step. */
  currentChordIndex: number;
  /** True when audio output is muted. */
  isMuted: boolean;
}

/**
 * Callback listener for audio playback state updates.
 */
export type PlaybackStateListener = (state: AudioPlaybackState) => void;

/**
 * Arrangement track enable and disable settings.
 */
export interface TrackArrangement {
  /** True to play Rhodes electric piano chords (default: true). */
  rhodes: boolean;
  /** True to play the warm monophonic sub-bass (default: true). */
  bass: boolean;
  /** True to play the procedural swung neo-soul drum groove (default: true). */
  drums: boolean;
  /** True to play subtle background vinyl texture (default: false). */
  vinyl: boolean;
}

/**
 * Optional configuration for AudioEngine initialization.
 */
export interface AudioEngineOptions {
  /** Master volume level in decibels (default: 0). */
  volume?: number;
  /** Lowpass filter cutoff frequency in Hz for Rhodes (default: 2200). */
  filterCutoff?: number;
  /** Enable or disable Rhodes electric piano (default: true). */
  enableRhodes?: boolean;
  /** Enable or disable sub-bass foundation (default: true). */
  enableBass?: boolean;
  /** Enable or disable neo-soul swung drum machine (default: true). */
  enableDrums?: boolean;
  /** Enable or disable subtle analog vinyl texture (default: false). */
  enableVinyl?: boolean;
  /** Swing ratio for drum groove (default: 0.58). */
  drumSwing?: number;
}

/**
 * Scheduled event descriptor for chord events.
 */
interface TimelineChordEvent {
  time: string;
  duration: string;
  stepIndex: number;
  pitches: string[];
}

/**
 * Scheduled event descriptor for sub-bass events.
 */
interface TimelineBassEvent {
  time: string;
  duration: string;
  pitch: string;
}

/**
 * Scheduled event descriptor for procedural drum events.
 */
interface TimelineDrumEvent {
  time: string;
  voice: 'kick' | 'snare' | 'hihatClosed' | 'hihatOpen';
  velocity: number;
}

/**
 * Headless Multi-Track Tone.js audio playback engine for harmonic progressions.
 *
 * Provides rich multi-timbral neo-soul sound design:
 * - Polyphonic analog Rhodes electric piano with warm filtering, chorus, and room reverb
 * - Monophonic warm sub-bass following the lowest voice of each chord step
 * - Procedural swung lofi drum machine synced precisely to progression tempo
 * - Optional filtered analog vinyl warmth
 * - Web Audio autoplay policy compliance, transport synchronization,
 *   and high-frequency 60fps playback state emission for fluid UI visualizations.
 */
export class AudioEngine {
  private timeline: ProgressionTimeline;

  // Master volume and transport
  private readonly volumeNode: Tone.Volume;
  private readonly transport: ReturnType<typeof Tone.getTransport>;

  // Rhodes electric piano track
  private readonly synth: Tone.PolySynth<Tone.Synth>;
  private readonly filter: Tone.Filter;
  private readonly chorus: Tone.Chorus;
  private readonly reverb: Tone.Reverb;
  private readonly rhodesVolume: Tone.Volume;

  // Sub-bass foundation track
  private readonly bassSynth: Tone.MonoSynth;
  private readonly bassVolume: Tone.Volume;

  // Neo-soul drum machine track
  private readonly kick: Tone.MembraneSynth;
  private readonly snare: Tone.NoiseSynth;
  private readonly snareFilter: Tone.Filter;
  private readonly hatClosed: Tone.NoiseSynth;
  private readonly hatOpen: Tone.NoiseSynth;
  private readonly hatFilter: Tone.Filter;
  private readonly drumReverb: Tone.Reverb;
  private readonly drumVolume: Tone.Volume;

  // Vinyl texture track
  private readonly vinylNoise: Tone.Noise;
  private readonly vinylFilter: Tone.Filter;
  private readonly vinylVolume: Tone.Volume;

  // Scheduled parts
  private rhodesPart: Tone.Part<TimelineChordEvent> | null = null;
  private bassPart: Tone.Part<TimelineBassEvent> | null = null;
  private drumsPart: Tone.Part<TimelineDrumEvent> | null = null;

  // Arrangement state
  private arrangement: TrackArrangement;
  private drumSwing: number;

  private readonly listeners: Set<PlaybackStateListener> = new Set();
  private animationFrameId: number | null = null;
  private intervalId: ReturnType<typeof setInterval> | null = null;

  private _isAudioStarted: boolean = false;
  private _isPlaying: boolean = false;
  private _isMuted: boolean = false;
  private currentVolumeDb: number = 0;
  private state: AudioPlaybackState;

  constructor(timeline: ProgressionTimeline, options: AudioEngineOptions = {}) {
    this.timeline = timeline;
    this.currentVolumeDb = options.volume ?? 0;
    this.drumSwing = options.drumSwing ?? 0.58;
    this.transport = Tone.getTransport();
    this.transport.bpm.value = timeline.bpm;

    this.arrangement = {
      rhodes: options.enableRhodes ?? true,
      bass: options.enableBass ?? true,
      drums: options.enableDrums ?? true,
      vinyl: options.enableVinyl ?? false,
    };

    // Master output node
    this.volumeNode = new Tone.Volume(this.currentVolumeDb);
    this.volumeNode.toDestination();

    // 1. Rhodes Sound Design:
    // Warm triangle oscillator with key-envelope
    this.synth = new Tone.PolySynth(Tone.Synth, {
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

    this.filter = new Tone.Filter({
      frequency: options.filterCutoff ?? 2200,
      type: 'lowpass',
      rolloff: -12,
      Q: 1.2,
    });

    this.chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.4,
      wet: 0.25,
    }).start();

    this.reverb = new Tone.Reverb({
      decay: 1.6,
      preDelay: 0.01,
      wet: 0.18,
    });

    this.rhodesVolume = new Tone.Volume(0);
    this.rhodesVolume.mute = !this.arrangement.rhodes;

    this.synth.chain(
      this.filter,
      this.chorus,
      this.reverb,
      this.rhodesVolume,
      this.volumeNode,
    );

    // 2. Sub-Bass Foundation Sound Design:
    // Warm monophonic sub-bass with punchy attack
    this.bassSynth = new Tone.MonoSynth({
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
        frequency: 280,
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

    this.bassVolume = new Tone.Volume(-2);
    this.bassVolume.mute = !this.arrangement.bass;
    this.bassSynth.chain(this.bassVolume, this.volumeNode);

    // 3. Neo-Soul Drum Groove Sound Design:
    // Membrane kick with pitch-drop envelope
    this.kick = new Tone.MembraneSynth({
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

    // Soft rimshot / snare backbeat with pink noise
    this.snare = new Tone.NoiseSynth({
      noise: { type: 'pink' },
      envelope: {
        attack: 0.003,
        decay: 0.14,
        sustain: 0.0,
        release: 0.14,
      },
    });

    this.snareFilter = new Tone.Filter({
      frequency: 1500,
      type: 'bandpass',
      Q: 2.0,
    });

    // Closed hi-hat
    this.hatClosed = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.04,
        sustain: 0.0,
        release: 0.04,
      },
    });

    // Open hi-hat with extended release
    this.hatOpen = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: {
        attack: 0.001,
        decay: 0.18,
        sustain: 0.0,
        release: 0.18,
      },
    });

    this.hatFilter = new Tone.Filter({
      frequency: 7200,
      type: 'highpass',
      rolloff: -12,
    });

    this.drumReverb = new Tone.Reverb({
      decay: 1.4,
      preDelay: 0.01,
      wet: 0.22,
    });

    this.drumVolume = new Tone.Volume(-3);
    this.drumVolume.mute = !this.arrangement.drums;

    this.kick.connect(this.drumVolume);
    this.snare.chain(this.snareFilter, this.drumReverb, this.drumVolume);
    this.hatClosed.chain(this.hatFilter, this.drumVolume);
    this.hatOpen.chain(this.hatFilter, this.drumReverb, this.drumVolume);
    this.drumVolume.connect(this.volumeNode);

    // 4. Subtle Vinyl Texture Sound Design:
    this.vinylNoise = new Tone.Noise({
      type: 'pink',
    });

    this.vinylFilter = new Tone.Filter({
      frequency: 950,
      type: 'lowpass',
      rolloff: -12,
      Q: 0.7,
    });

    this.vinylVolume = new Tone.Volume(-36);
    this.vinylVolume.mute = !this.arrangement.vinyl;
    this.vinylNoise.chain(this.vinylFilter, this.vinylVolume, this.volumeNode);

    this.state = {
      isPlaying: false,
      progress: 0,
      currentChordIndex: 0,
      isMuted: false,
    };

    this.scheduleProgression();
  }

  /**
   * Safe AudioContext initialization conforming to browser autoplay policies.
   * Must be called in response to a user interaction before audible playback begins.
   */
  public async startAudio(): Promise<void> {
    if (this._isAudioStarted && Tone.getContext().state === 'running') {
      return;
    }
    await Tone.start();
    this._isAudioStarted = true;
  }

  /**
   * Returns true if Tone.start() has successfully unlocked the AudioContext.
   */
  public get isAudioStarted(): boolean {
    return this._isAudioStarted && Tone.getContext().state === 'running';
  }

  /**
   * Starts or resumes progression playback from current transport position.
   */
  public async play(): Promise<void> {
    if (!this.isAudioStarted) {
      await this.startAudio();
    }
    if (this._isPlaying) {
      return;
    }

    if (this.arrangement.vinyl && this.vinylNoise.state !== 'started') {
      this.vinylNoise.start();
    }

    this.transport.start();
    this._isPlaying = true;
    this.startProgressLoop();
    this.updatePlaybackState();
  }

  /**
   * Pauses progression playback while preserving the current playhead position.
   */
  public pause(): void {
    if (!this._isPlaying) {
      return;
    }

    this._isPlaying = false;
    this.stopProgressLoop();
    this.transport.pause();
    this.synth.releaseAll();
    this.bassSynth.triggerRelease();
    if (this.vinylNoise.state === 'started') {
      this.vinylNoise.stop();
    }
    this.updatePlaybackState();
  }

  /**
   * Stops playback and resets transport position to the start.
   */
  public stop(): void {
    this._isPlaying = false;
    this.stopProgressLoop();
    this.transport.stop();
    this.synth.releaseAll();
    this.bassSynth.triggerRelease();
    if (this.vinylNoise.state === 'started') {
      this.vinylNoise.stop();
    }
    this.transport.ticks = 0;
    this.updatePlaybackState();
  }

  /**
   * Toggles between play and pause states.
   */
  public async togglePlay(): Promise<void> {
    if (this._isPlaying) {
      this.pause();
    } else {
      await this.play();
    }
  }

  /**
   * Seeks playback to a normalized progression position (0.0 to 1.0).
   */
  public seek(progress: number): void {
    const clamped = Math.max(0, Math.min(1, progress));
    const totalTicks = this.getTotalTicks();

    if (totalTicks > 0) {
      const targetTick = clamped >= 1 ? 0 : Math.round(clamped * totalTicks);
      this.transport.ticks = targetTick;
    }

    this.synth.releaseAll();
    this.bassSynth.triggerRelease();
    this.updatePlaybackState();
  }

  /**
   * Updates playback tempo in beats per minute.
   */
  public setBpm(bpm: number): void {
    if (bpm <= 0) {
      return;
    }
    this.transport.bpm.value = bpm;
    this.timeline.bpm = bpm;
    this.scheduleProgression();
    this.updatePlaybackState();
  }

  /**
   * Toggles audio mute state without altering playback timing.
   */
  public toggleMute(): void {
    this._isMuted = !this._isMuted;
    this.volumeNode.mute = this._isMuted;
    this.updatePlaybackState();
  }

  /**
   * Sets master output volume in decibels.
   */
  public setVolume(db: number): void {
    this.currentVolumeDb = db;
    this.volumeNode.volume.value = db;
  }

  /**
   * Dynamically toggles individual track arrangement during live playback.
   */
  public setArrangement(options: Partial<TrackArrangement>): void {
    if (options.rhodes !== undefined) {
      this.arrangement.rhodes = options.rhodes;
      this.rhodesVolume.mute = !options.rhodes;
    }
    if (options.bass !== undefined) {
      this.arrangement.bass = options.bass;
      this.bassVolume.mute = !options.bass;
      if (!options.bass) {
        this.bassSynth.triggerRelease();
      }
    }
    if (options.drums !== undefined) {
      this.arrangement.drums = options.drums;
      this.drumVolume.mute = !options.drums;
    }
    if (options.vinyl !== undefined) {
      this.arrangement.vinyl = options.vinyl;
      this.vinylVolume.mute = !options.vinyl;
      if (options.vinyl && this._isPlaying && this.vinylNoise.state !== 'started') {
        this.vinylNoise.start();
      } else if (!options.vinyl && this.vinylNoise.state === 'started') {
        this.vinylNoise.stop();
      }
    }
  }

  /**
   * Returns current active track arrangement settings.
   */
  public getArrangement(): TrackArrangement {
    return { ...this.arrangement };
  }

  /**
   * Adjusts volume level for a specific arrangement track in decibels.
   */
  public setTrackVolume(
    track: 'master' | 'rhodes' | 'bass' | 'drums' | 'vinyl',
    volumeDb: number,
  ): void {
    switch (track) {
      case 'master':
        this.setVolume(volumeDb);
        break;
      case 'rhodes':
        this.rhodesVolume.volume.value = volumeDb;
        break;
      case 'bass':
        this.bassVolume.volume.value = volumeDb;
        break;
      case 'drums':
        this.drumVolume.volume.value = volumeDb;
        break;
      case 'vinyl':
        this.vinylVolume.volume.value = volumeDb;
        break;
    }
  }

  /**
   * Replaces or updates the progression timeline, rescheduling all events.
   */
  public setTimeline(timeline: ProgressionTimeline): void {
    this.timeline = timeline;
    this.transport.bpm.value = timeline.bpm;
    this.scheduleProgression();
    this.updatePlaybackState();
  }

  /**
   * Subscribes a listener to playback state changes.
   * Immediately notifies listener of current state upon registration.
   * Returns an unsubscribe function.
   */
  public subscribe(listener: PlaybackStateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Returns a snapshot of the current playback state.
   */
  public getState(): AudioPlaybackState {
    return { ...this.state };
  }

  /**
   * Returns true if audio is actively playing.
   */
  public get isPlaying(): boolean {
    return this._isPlaying;
  }

  /**
   * Returns true if output volume is muted.
   */
  public get isMuted(): boolean {
    return this._isMuted;
  }

  /**
   * Returns current normalized progress (0.0 to 1.0).
   */
  public get progress(): number {
    return this.state.progress;
  }

  /**
   * Returns zero-based index of the currently active chord step.
   */
  public get currentChordIndex(): number {
    return this.state.currentChordIndex;
  }

  /**
   * Resolves the current active chord step from the progression timeline.
   */
  public getCurrentStep(): ChordStep {
    const step = this.timeline.steps[this.state.currentChordIndex];
    if (step) {
      return step;
    }
    const firstStep = this.timeline.steps[0];
    if (firstStep) {
      return firstStep;
    }
    throw new Error('Timeline contains no chord steps');
  }

  /**
   * Disposes all audio nodes, scheduled events, and listeners.
   */
  public dispose(): void {
    this.pause();
    this.stopProgressLoop();

    if (this.rhodesPart) {
      this.rhodesPart.dispose();
      this.rhodesPart = null;
    }
    if (this.bassPart) {
      this.bassPart.dispose();
      this.bassPart = null;
    }
    if (this.drumsPart) {
      this.drumsPart.dispose();
      this.drumsPart = null;
    }

    this.transport.cancel(0);

    // Dispose Rhodes chain
    this.synth.dispose();
    this.filter.dispose();
    this.chorus.dispose();
    this.reverb.dispose();
    this.rhodesVolume.dispose();

    // Dispose Bass chain
    this.bassSynth.dispose();
    this.bassVolume.dispose();

    // Dispose Drum chain
    this.kick.dispose();
    this.snare.dispose();
    this.snareFilter.dispose();
    this.hatClosed.dispose();
    this.hatOpen.dispose();
    this.hatFilter.dispose();
    this.drumReverb.dispose();
    this.drumVolume.dispose();

    // Dispose Vinyl chain
    this.vinylNoise.dispose();
    this.vinylFilter.dispose();
    this.vinylVolume.dispose();

    this.volumeNode.dispose();
    this.listeners.clear();
  }

  /**
   * Schedules multi-track repeating events onto Tone.Part synced with Tone.Transport.
   */
  private scheduleProgression(): void {
    if (this.rhodesPart) {
      this.rhodesPart.dispose();
      this.rhodesPart = null;
    }
    if (this.bassPart) {
      this.bassPart.dispose();
      this.bassPart = null;
    }
    if (this.drumsPart) {
      this.drumsPart.dispose();
      this.drumsPart = null;
    }

    const totalBeats = this.timeline.getTotalBeats();
    if (totalBeats <= 0 || this.timeline.steps.length === 0) {
      return;
    }

    const totalTicks = totalBeats * this.transport.PPQ;
    this.transport.setLoopPoints(0, `${totalTicks}i`);
    this.transport.loop = true;

    // 1. Schedule Rhodes Chord Part
    let accumulatedBeats = 0;
    const chordEvents: TimelineChordEvent[] = [];
    const bassEvents: TimelineBassEvent[] = [];

    for (let i = 0; i < this.timeline.steps.length; i++) {
      const step = this.timeline.steps[i];
      if (!step) {
        continue;
      }

      const eventTimeTicks = accumulatedBeats * this.transport.PPQ;
      const durationTicks = Math.max(1, step.durationBeats * this.transport.PPQ - 8);
      const pitches = step.voices.map((v) => v.pitch);

      chordEvents.push({
        time: `${eventTimeTicks}i`,
        duration: `${durationTicks}i`,
        stepIndex: i,
        pitches,
      });

      const bassPitch = resolveSubBassPitch(step);
      bassEvents.push({
        time: `${eventTimeTicks}i`,
        duration: `${durationTicks}i`,
        pitch: bassPitch.pitch,
      });

      accumulatedBeats += step.durationBeats;
    }

    this.rhodesPart = new Tone.Part<TimelineChordEvent>((time, event) => {
      if (this.arrangement.rhodes) {
        this.synth.triggerAttackRelease(event.pitches, event.duration, time, 0.75);
      }
    }, chordEvents);

    this.rhodesPart.loop = true;
    this.rhodesPart.loopStart = 0;
    this.rhodesPart.loopEnd = `${totalTicks}i`;
    this.rhodesPart.start(0);

    // 2. Schedule Sub-Bass Part
    this.bassPart = new Tone.Part<TimelineBassEvent>((time, event) => {
      if (this.arrangement.bass) {
        this.bassSynth.triggerAttackRelease(event.pitch, event.duration, time, 0.85);
      }
    }, bassEvents);

    this.bassPart.loop = true;
    this.bassPart.loopStart = 0;
    this.bassPart.loopEnd = `${totalTicks}i`;
    this.bassPart.start(0);

    // 3. Schedule Drum Groove Part
    const drumHits = generateNeoSoulDrumGroove(totalBeats, this.timeline.bpm, this.drumSwing);
    const drumEvents: TimelineDrumEvent[] = drumHits.map((hit) => ({
      time: `${Math.round(hit.beat * this.transport.PPQ)}i`,
      voice: hit.voice,
      velocity: hit.velocity,
    }));

    this.drumsPart = new Tone.Part<TimelineDrumEvent>((time, event) => {
      if (!this.arrangement.drums) {
        return;
      }
      switch (event.voice) {
        case 'kick':
          this.kick.triggerAttackRelease('C1', '8n', time, event.velocity);
          break;
        case 'snare':
          this.snare.triggerAttackRelease('16n', time, event.velocity);
          break;
        case 'hihatClosed':
          this.hatClosed.triggerAttackRelease('16n', time, event.velocity);
          break;
        case 'hihatOpen':
          this.hatOpen.triggerAttackRelease('8n', time, event.velocity);
          break;
      }
    }, drumEvents);

    this.drumsPart.loop = true;
    this.drumsPart.loopStart = 0;
    this.drumsPart.loopEnd = `${totalTicks}i`;
    this.drumsPart.start(0);
  }

  /**
   * Calculates total timeline duration in clock ticks.
   */
  private getTotalTicks(): number {
    return this.timeline.getTotalBeats() * this.transport.PPQ;
  }

  /**
   * Calculates normalized playback progress (0.0 to 1.0) within the loop.
   */
  private calculateNormalizedProgress(): number {
    const totalTicks = this.getTotalTicks();
    if (totalTicks <= 0) {
      return 0;
    }

    const currentTicks = this.transport.ticks;
    if (typeof currentTicks === 'number' && Number.isFinite(currentTicks)) {
      const wrappedTicks = ((currentTicks % totalTicks) + totalTicks) % totalTicks;
      return wrappedTicks / totalTicks;
    }

    return 0;
  }

  /**
   * Updates internal state cache and notifies registered listeners.
   */
  private updatePlaybackState(): void {
    const progress = this.calculateNormalizedProgress();
    const totalBeats = this.timeline.getTotalBeats();
    let currentChordIndex = 0;

    if (totalBeats > 0 && this.timeline.steps.length > 0) {
      const currentBeat = Math.min(Math.max(0, progress), 0.999999) * totalBeats;
      const resolution = this.timeline.getStepAtBeat(currentBeat);
      currentChordIndex = resolution.stepIndex;
    }

    this.state = {
      isPlaying: this._isPlaying,
      progress,
      currentChordIndex,
      isMuted: this._isMuted,
    };

    this.notifyListeners();
  }

  /**
   * Dispatches state updates to all active listeners.
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      try {
        listener(this.state);
      } catch (err) {
        console.error('Error in AudioEngine subscriber listener:', err);
      }
    }
  }

  /**
   * Starts high-frequency animation loop (~60fps) for fluid visualizer progress.
   */
  private startProgressLoop(): void {
    if (this.animationFrameId !== null || this.intervalId !== null) {
      return;
    }

    if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
      const tick = () => {
        if (!this._isPlaying) {
          this.animationFrameId = null;
          return;
        }
        this.updatePlaybackState();
        this.animationFrameId = window.requestAnimationFrame(tick);
      };
      this.animationFrameId = window.requestAnimationFrame(tick);
    } else {
      this.intervalId = setInterval(() => {
        if (!this._isPlaying) {
          this.stopProgressLoop();
          return;
        }
        this.updatePlaybackState();
      }, 16);
    }
  }

  /**
   * Stops the high-frequency animation loop.
   */
  private stopProgressLoop(): void {
    if (this.animationFrameId !== null && typeof window !== 'undefined') {
      window.cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
