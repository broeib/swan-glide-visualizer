import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChordStep, ProgressionTimeline } from '../types/music';
import { AudioEngine, AudioPlaybackState } from './audioEngine';

/**
 * Return signature for the useAudioPlayback hook.
 */
export interface UseAudioPlaybackResult {
  /** True when audio playback is actively running. */
  isPlaying: boolean;
  /** Normalized progression position between 0.0 and 1.0. */
  progress: number;
  /** Zero-based index of the currently active chord step. */
  currentChordIndex: number;
  /** True when audio output is muted. */
  isMuted: boolean;
  /** Active ChordStep configuration at current playback position. */
  currentStep: ChordStep;
  /** Unlocks Web Audio context conforming to browser autoplay policies. */
  startAudio: () => Promise<void>;
  /** Starts playback from the current position. */
  play: () => Promise<void>;
  /** Pauses playback while preserving current position. */
  pause: () => void;
  /** Toggles between playing and paused states. */
  togglePlay: () => Promise<void>;
  /** Seeks to normalized 0.0 to 1.0 progression position. */
  seek: (progress: number) => void;
  /** Toggles audio mute state. */
  toggleMute: () => void;
  /** Updates progression playback tempo in beats per minute. */
  setBpm: (bpm: number) => void;
  /** Reference to the underlying AudioEngine instance. */
  engine: AudioEngine | null;
}

/**
 * Fallback empty ChordStep used if timeline steps are temporarily empty.
 */
const FALLBACK_CHORD_STEP: ChordStep = {
  chordName: '',
  artistHandle: '',
  durationBeats: 4,
  voices: [],
  guitarDiagram: {
    frets: ['x', 'x', 'x', 'x', 'x', 'x'],
    stringNotes: [],
  },
};

/**
 * React hook managing the headless AudioEngine lifecycle, transport state,
 * and public playback controls for a ProgressionTimeline.
 *
 * Provides reactive 60fps playhead progress and active chord indexing
 * suitable for synchronized visualization canvases and playback controls.
 */
export function useAudioPlayback(
  timeline: ProgressionTimeline
): UseAudioPlaybackResult {
  const engineRef = useRef<AudioEngine | null>(null);

  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(() => ({
    isPlaying: false,
    progress: 0,
    currentChordIndex: 0,
    isMuted: false,
  }));

  const getEngine = useCallback((): AudioEngine => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine(timeline);
    }
    return engineRef.current;
  }, [timeline]);

  // Synchronize timeline changes and state subscriptions
  useEffect(() => {
    const engine = getEngine();
    engine.setTimeline(timeline);

    const unsubscribe = engine.subscribe((state) => {
      setPlaybackState(state);
    });

    return () => {
      unsubscribe();
    };
  }, [getEngine, timeline]);

  // Clean up audio graph on component unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
    };
  }, []);

  const startAudio = useCallback(async () => {
    await getEngine().startAudio();
  }, [getEngine]);

  const play = useCallback(async () => {
    await getEngine().play();
  }, [getEngine]);

  const pause = useCallback(() => {
    getEngine().pause();
  }, [getEngine]);

  const togglePlay = useCallback(async () => {
    await getEngine().togglePlay();
  }, [getEngine]);

  const seek = useCallback(
    (progress: number) => {
      getEngine().seek(progress);
    },
    [getEngine]
  );

  const toggleMute = useCallback(() => {
    getEngine().toggleMute();
  }, [getEngine]);

  const setBpm = useCallback(
    (bpm: number) => {
      getEngine().setBpm(bpm);
    },
    [getEngine]
  );

  const currentStep: ChordStep = useMemo(() => {
    const activeStep = timeline.steps[playbackState.currentChordIndex];
    if (activeStep) {
      return activeStep;
    }
    const firstStep = timeline.steps[0];
    if (firstStep) {
      return firstStep;
    }
    return FALLBACK_CHORD_STEP;
  }, [timeline.steps, playbackState.currentChordIndex]);

  return {
    isPlaying: playbackState.isPlaying,
    progress: playbackState.progress,
    currentChordIndex: playbackState.currentChordIndex,
    isMuted: playbackState.isMuted,
    currentStep,
    startAudio,
    play,
    pause,
    togglePlay,
    seek,
    toggleMute,
    setBpm,
    engine: engineRef.current,
  };
}
