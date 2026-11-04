import * as Tone from 'tone';
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
 * Optional configuration for AudioEngine initialization.
 */
export interface AudioEngineOptions {
  /** Master volume level in decibels (default: 0). */
  volume?: number;
  /** Lowpass filter cutoff frequency in Hz (default: 2200). */
  filterCutoff?: number;
}

/**
 * Internal scheduled event descriptor for Tone.Part.
 */
interface TimelineChordEvent {
  time: string;
  duration: string;
  stepIndex: number;
  pitches: string[];
}

/**
 * Headless Tone.js audio playback engine for harmonic progressions.
 *
 * Provides analog electric piano synthesis with warm filtering and chorus,
 * Web Audio autoplay policy compliance, transport synchronization,
 * and high-frequency playback state emission for fluid UI visualizations.
 */
export class AudioEngine {
  private timeline: ProgressionTimeline;
  private readonly synth: Tone.PolySynth<Tone.Synth>;
  private readonly filter: Tone.Filter;
  private readonly chorus: Tone.Chorus;
  private readonly reverb: Tone.Reverb;
  private readonly volumeNode: Tone.Volume;
  private readonly transport: ReturnType<typeof Tone.getTransport>;

  private part: Tone.Part<TimelineChordEvent> | null = null;
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
    this.transport = Tone.getTransport();
    this.transport.bpm.value = timeline.bpm;

    // Sound Design: Mellow analog/Rhodes electric piano tone
    // Triangle oscillator provides warm body with gentle odd harmonics
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

    // Gentle lowpass filter removing harsh high-frequency transients
    this.filter = new Tone.Filter({
      frequency: options.filterCutoff ?? 2200,
      type: 'lowpass',
      rolloff: -12,
      Q: 1.2,
    });

    // Subtle stereophonic chorus for Rhodes tine modulation
    this.chorus = new Tone.Chorus({
      frequency: 1.5,
      delayTime: 3.5,
      depth: 0.4,
      wet: 0.25,
    }).start();

    // Subtle acoustic room reverb for depth and decay tail
    this.reverb = new Tone.Reverb({
      decay: 1.6,
      preDelay: 0.01,
      wet: 0.18,
    });

    // Dedicated output volume node with headroom for polyphonic chords
    this.volumeNode = new Tone.Volume(this.currentVolumeDb);

    // Audio node routing chain:
    // PolySynth -> Filter -> Chorus -> Reverb -> VolumeNode -> Destination
    this.synth.chain(
      this.filter,
      this.chorus,
      this.reverb,
      this.volumeNode,
      Tone.getDestination()
    );

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
   * Sets output volume in decibels.
   */
  public setVolume(db: number): void {
    this.currentVolumeDb = db;
    this.volumeNode.volume.value = db;
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

    if (this.part) {
      this.part.dispose();
      this.part = null;
    }

    this.transport.cancel(0);
    this.synth.dispose();
    this.filter.dispose();
    this.chorus.dispose();
    this.reverb.dispose();
    this.volumeNode.dispose();
    this.listeners.clear();
  }

  /**
   * Schedules repeating chord events onto Tone.Part synced with Tone.Transport.
   */
  private scheduleProgression(): void {
    if (this.part) {
      this.part.dispose();
      this.part = null;
    }

    const totalBeats = this.timeline.getTotalBeats();
    if (totalBeats <= 0 || this.timeline.steps.length === 0) {
      return;
    }

    const totalTicks = totalBeats * this.transport.PPQ;
    this.transport.setLoopPoints(0, `${totalTicks}i`);
    this.transport.loop = true;

    let accumulatedBeats = 0;
    const events: TimelineChordEvent[] = [];

    for (let i = 0; i < this.timeline.steps.length; i++) {
      const step = this.timeline.steps[i];
      if (!step) {
        continue;
      }

      const eventTimeTicks = accumulatedBeats * this.transport.PPQ;
      // Slight margin before step end allows clean note release and envelope re-trigger
      const durationTicks = Math.max(1, step.durationBeats * this.transport.PPQ - 8);
      const pitches = step.voices.map((v) => v.pitch);

      events.push({
        time: `${eventTimeTicks}i`,
        duration: `${durationTicks}i`,
        stepIndex: i,
        pitches,
      });

      accumulatedBeats += step.durationBeats;
    }

    this.part = new Tone.Part<TimelineChordEvent>((time, event) => {
      // Polyphonic trigger with gentle velocity for warm Rhodes character
      this.synth.triggerAttackRelease(event.pitches, event.duration, time, 0.75);
    }, events);

    this.part.loop = true;
    this.part.loopStart = 0;
    this.part.loopEnd = `${totalTicks}i`;
    this.part.start(0);
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
