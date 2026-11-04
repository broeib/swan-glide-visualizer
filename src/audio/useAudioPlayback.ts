import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ChordStep, ProgressionTimeline } from '../types/music';
import { AudioEngine, AudioPlaybackState } from './audioEngine';

/**
 * Supported audio playback modes:
 * - 'studio': Plays the authentic studio-mastered Swan Glide recording from the reference video.
 * - 'synth': Plays the interactive Tone.js polyphonic Rhodes engine.
 */
export type AudioMode = 'studio' | 'synth';

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
  /** Active audio mode ('studio' or 'synth'). */
  audioMode: AudioMode;
  /** Switches between 'studio' and 'synth' audio playback modes. */
  setAudioMode: (mode: AudioMode) => void;
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
  /** Reference to the HTML5 Audio element for stream capture. */
  audioElement: HTMLAudioElement | null;
}

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
 * Path to the authentic studio reference recording.
 */
const STUDIO_AUDIO_URL = '/audio/swan_glide_reference.mp3';

/**
 * Duration in seconds for the reference progression loop (24 seconds).
 */
const LOOP_DURATION_SECONDS = 24.0;

/**
 * React hook managing synchronized audio playback.
 *
 * Supports both studio reference audio playback and Tone.js synthesis,
 * emitting reactive 60fps playhead progress and active chord indexing.
 */
export function useAudioPlayback(
  timeline: ProgressionTimeline
): UseAudioPlaybackResult {
  const engineRef = useRef<AudioEngine | null>(null);
  const studioAudioRef = useRef<HTMLAudioElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const [audioMode, setAudioMode] = useState<AudioMode>('studio');

  const [playbackState, setPlaybackState] = useState<AudioPlaybackState>(() => ({
    isPlaying: false,
    progress: 0,
    currentChordIndex: 0,
    isMuted: false,
  }));

  // Initialize HTML5 studio audio element
  useEffect(() => {
    const audio = new Audio(STUDIO_AUDIO_URL);
    audio.preload = 'auto';
    audio.loop = false;
    audio.volume = 1.0;
    studioAudioRef.current = audio;

    return () => {
      audio.pause();
      audio.src = '';
      studioAudioRef.current = null;
    };
  }, []);

  const getEngine = useCallback((): AudioEngine => {
    if (!engineRef.current) {
      engineRef.current = new AudioEngine(timeline);
    }
    return engineRef.current;
  }, [timeline]);

  // Subscribe to Tone.js engine when in 'synth' mode
  useEffect(() => {
    if (audioMode !== 'synth') {
      return;
    }

    const engine = getEngine();
    engine.setTimeline(timeline);

    const unsubscribe = engine.subscribe((state) => {
      setPlaybackState(state);
    });

    return () => {
      unsubscribe();
    };
  }, [audioMode, getEngine, timeline]);

  // Progress animation frame loop for Studio Audio mode
  useEffect(() => {
    if (audioMode !== 'studio') {
      return;
    }

    const audio = studioAudioRef.current;
    if (!audio) {
      return;
    }

    let isRunning = true;

    const tick = () => {
      if (!isRunning) {
        return;
      }

      if (!audio.paused && !audio.ended) {
        const currentTime = audio.currentTime;
        // Loop at LOOP_DURATION_SECONDS
        const loopTime = currentTime % LOOP_DURATION_SECONDS;
        if (currentTime >= LOOP_DURATION_SECONDS && audio.loop === false) {
          audio.currentTime = 0;
        }

        const normalizedProgress = loopTime / LOOP_DURATION_SECONDS;
        const totalBeats = timeline.getTotalBeats();
        const currentBeat = normalizedProgress * totalBeats;
        const resolution = timeline.getStepAtBeat(currentBeat);

        setPlaybackState((prev) => ({
          ...prev,
          isPlaying: true,
          progress: normalizedProgress,
          currentChordIndex: resolution.stepIndex,
        }));
      }

      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      isRunning = false;
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [audioMode, timeline]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
      }
      if (studioAudioRef.current) {
        studioAudioRef.current.pause();
      }
    };
  }, []);

  const startAudio = useCallback(async () => {
    if (audioMode === 'synth') {
      await getEngine().startAudio();
    }
  }, [audioMode, getEngine]);

  const play = useCallback(async () => {
    if (audioMode === 'studio') {
      const audio = studioAudioRef.current;
      if (audio) {
        await audio.play();
        setPlaybackState((prev) => ({ ...prev, isPlaying: true }));
      }
    } else {
      await getEngine().play();
    }
  }, [audioMode, getEngine]);

  const pause = useCallback(() => {
    if (audioMode === 'studio') {
      const audio = studioAudioRef.current;
      if (audio) {
        audio.pause();
        setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
      }
    } else {
      getEngine().pause();
    }
  }, [audioMode, getEngine]);

  const togglePlay = useCallback(async () => {
    if (playbackState.isPlaying) {
      pause();
    } else {
      await play();
    }
  }, [pause, play, playbackState.isPlaying]);

  const seek = useCallback(
    (targetProgress: number) => {
      const clamped = Math.max(0, Math.min(1, targetProgress));

      if (audioMode === 'studio') {
        const audio = studioAudioRef.current;
        if (audio) {
          audio.currentTime = clamped * LOOP_DURATION_SECONDS;
        }
        const totalBeats = timeline.getTotalBeats();
        const resolution = timeline.getStepAtBeat(clamped * totalBeats);
        setPlaybackState((prev) => ({
          ...prev,
          progress: clamped,
          currentChordIndex: resolution.stepIndex,
        }));
      } else {
        getEngine().seek(clamped);
      }
    },
    [audioMode, getEngine, timeline]
  );

  const toggleMute = useCallback(() => {
    if (audioMode === 'studio') {
      const audio = studioAudioRef.current;
      if (audio) {
        audio.muted = !audio.muted;
        setPlaybackState((prev) => ({ ...prev, isMuted: audio.muted }));
      }
    } else {
      getEngine().toggleMute();
      setPlaybackState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
    }
  }, [audioMode, getEngine]);

  const setBpm = useCallback(
    (bpm: number) => {
      if (audioMode === 'synth') {
        getEngine().setBpm(bpm);
      }
    },
    [audioMode, getEngine]
  );

  const handleSetAudioMode = useCallback(
    (newMode: AudioMode) => {
      if (newMode === audioMode) {
        return;
      }

      // Stop current playback before switching
      if (playbackState.isPlaying) {
        if (audioMode === 'studio' && studioAudioRef.current) {
          studioAudioRef.current.pause();
        } else if (audioMode === 'synth' && engineRef.current) {
          engineRef.current.pause();
        }
        setPlaybackState((prev) => ({ ...prev, isPlaying: false }));
      }

      setAudioMode(newMode);
    },
    [audioMode, playbackState.isPlaying]
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
    audioMode,
    setAudioMode: handleSetAudioMode,
    startAudio,
    play,
    pause,
    togglePlay,
    seek,
    toggleMute,
    setBpm,
    engine: engineRef.current,
    audioElement: studioAudioRef.current,
  };
}
