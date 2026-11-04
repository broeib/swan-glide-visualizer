import React, { useCallback, useRef } from 'react';
import clsx from 'clsx';
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';

/**
 * Props for the PlaybackControls component.
 */
export interface PlaybackControlsProps {
  /** True when audio playback transport is actively running. */
  isPlaying: boolean;
  /** True when audio output is currently muted. */
  isMuted: boolean;
  /** Normalized progression position between 0.0 and 1.0. */
  progress: number;
  /** Playback tempo in beats per minute. */
  bpm: number;
  /** Total progression duration in seconds. */
  totalDurationSeconds: number;
  /** Callback invoked to toggle play and pause states. */
  onTogglePlay: () => void;
  /** Callback invoked to toggle audio mute state. */
  onToggleMute: () => void;
  /** Callback invoked when the user seeks to a new progress position (0.0 to 1.0). */
  onSeek: (progress: number) => void;
  /** Optional callback invoked to restart playback from the beginning. */
  onRestart?: () => void;
  /** Optional container class name. */
  className?: string;
}

/**
 * Formats a duration in seconds to standard MM:SS string notation.
 */
function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const remainingSeconds = totalSeconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * PlaybackControls component.
 *
 * Provides primary transport controls for the chord progression player:
 * - Interactive timeline progress scrubber bar with elapsed and total duration
 * - Prominent centered circular Play/Pause button with glowing shadow
 * - Secondary controls: Mute/Unmute, Restart progression, and BPM indicator pill
 */
export const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  isPlaying,
  isMuted,
  progress,
  bpm,
  totalDurationSeconds,
  onTogglePlay,
  onToggleMute,
  onSeek,
  onRestart,
  className,
}) => {
  const progressBarRef = useRef<HTMLDivElement>(null);

  const clampedProgress = Math.max(0, Math.min(1, progress || 0));
  const elapsedSeconds = clampedProgress * (totalDurationSeconds || 0);

  // Computes progress from pointer client coordinates
  const handleSeekFromPointer = useCallback(
    (clientX: number) => {
      if (!progressBarRef.current) {
        return;
      }
      const rect = progressBarRef.current.getBoundingClientRect();
      if (rect.width <= 0) {
        return;
      }
      const ratio = (clientX - rect.left) / rect.width;
      const targetProgress = Math.max(0, Math.min(1, ratio));
      onSeek(targetProgress);
    },
    [onSeek]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    handleSeekFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.buttons === 1) {
      handleSeekFromPointer(e.clientX);
    }
  };

  const handleRestart = () => {
    if (onRestart) {
      onRestart();
    } else {
      onSeek(0);
    }
  };

  return (
    <div
      className={clsx(
        'w-full flex flex-col gap-4 p-5 rounded-3xl bg-white/60 backdrop-blur-md border border-white/70 shadow-sm transition-all duration-300',
        className
      )}
    >
      {/* Progress timeline scrubber section */}
      <div className="flex flex-col gap-1.5">
        {/* Time counter row: formatted time e.g. 0:04 / 0:13 */}
        <div className="flex items-center justify-between text-xs font-mono font-bold text-[#2D1B4E]/70">
          <span>{formatTime(elapsedSeconds)}</span>
          <span className="text-[#2D1B4E]/40 font-normal">/</span>
          <span>{formatTime(totalDurationSeconds)}</span>
        </div>

        {/* Interactive scrubber bar */}
        <div
          ref={progressBarRef}
          role="slider"
          tabIndex={0}
          aria-label="Progression timeline scrubber"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clampedProgress * 100)}
          aria-valuetext={`${formatTime(elapsedSeconds)} of ${formatTime(totalDurationSeconds)}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onKeyDown={(e) => {
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') {
              e.preventDefault();
              onSeek(Math.min(1, clampedProgress + 0.05));
            } else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
              e.preventDefault();
              onSeek(Math.max(0, clampedProgress - 0.05));
            } else if (e.key === 'Home') {
              e.preventDefault();
              onSeek(0);
            } else if (e.key === 'End') {
              e.preventDefault();
              onSeek(1);
            }
          }}
          className="relative w-full h-5 flex items-center cursor-pointer group touch-none outline-none focus-visible:ring-2 focus-visible:ring-violet-400 rounded-full"
        >
          {/* Background track */}
          <div className="w-full h-2 rounded-full bg-slate-200/80 group-hover:h-2.5 transition-all duration-150 overflow-hidden">
            {/* Filled progress bar */}
            <div
              className="h-full rounded-full bg-[#2D1B4E] transition-[width] duration-75"
              style={{ width: `${clampedProgress * 100}%` }}
            />
          </div>

          {/* Draggable thumb */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-[#2D1B4E] border-2 border-white shadow-md scale-90 group-hover:scale-110 active:scale-125 transition-transform duration-150 pointer-events-none"
            style={{ left: `${clampedProgress * 100}%` }}
          />
        </div>
      </div>

      {/* Main controls row: Secondary left, Centered Play/Pause, Secondary right */}
      <div className="flex items-center justify-between pt-1">
        {/* Left cluster: Reset button and BPM pill */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleRestart}
            aria-label="Restart playback from beginning"
            title="Restart playback"
            className="p-2.5 rounded-full text-[#2D1B4E]/70 hover:text-[#2D1B4E] hover:bg-violet-100/70 active:scale-95 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet-400"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* BPM indicator pill */}
          <div
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/70 border border-violet-200/60 text-[#2D1B4E] text-xs font-bold font-mono tracking-wide select-none"
            title="Progression tempo"
          >
            <span
              className={clsx(
                'w-1.5 h-1.5 rounded-full bg-[#2D1B4E] transition-opacity duration-200',
                isPlaying ? 'animate-pulse' : 'opacity-40'
              )}
            />
            <span>{bpm} BPM</span>
          </div>
        </div>

        {/* Center: Prominent Play/Pause button */}
        <div className="flex items-center justify-center">
          <button
            type="button"
            onClick={onTogglePlay}
            aria-label={isPlaying ? 'Pause playback' : 'Start playback'}
            title={isPlaying ? 'Pause' : 'Play'}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#2D1B4E] hover:bg-[#3B2464] active:scale-95 text-white flex items-center justify-center shadow-lg shadow-[#2D1B4E]/30 hover:shadow-xl hover:shadow-[#2D1B4E]/40 transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-violet-400 focus-visible:ring-offset-2"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 sm:w-7 sm:h-7 fill-current" />
            ) : (
              <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Right cluster: Audio mute toggle button */}
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={onToggleMute}
            aria-label={isMuted ? 'Unmute audio' : 'Mute audio'}
            title={isMuted ? 'Unmute audio' : 'Mute audio'}
            className={clsx(
              'p-2.5 rounded-full transition-all duration-150 active:scale-95 outline-none focus-visible:ring-2 focus-visible:ring-violet-400',
              isMuted
                ? 'text-rose-600 bg-rose-50 hover:bg-rose-100'
                : 'text-[#2D1B4E]/70 hover:text-[#2D1B4E] hover:bg-violet-100/70'
            )}
          >
            {isMuted ? (
              <VolumeX className="w-5 h-5" />
            ) : (
              <Volume2 className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
