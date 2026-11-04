import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Guitar,
  Piano,
  Wand2,
  Copy,
  Check,
  ExternalLink,
} from 'lucide-react';
import clsx from 'clsx';
import { mockProgression } from './data/mockProgression';
import { useAudioPlayback } from './audio/useAudioPlayback';
import { VoiceLeadingCanvas } from './components/VoiceLeadingCanvas';
import { GuitarFretboard } from './components/GuitarFretboard';
import { KeyboardDiagram } from './components/KeyboardDiagram';
import { HeaderChordDisplay } from './components/HeaderChordDisplay';
import { VideoExporter } from './components/VideoExporter';
import {
  getThemePreset,
  THEME_PRESETS_LIST,
  ThemePresetId,
} from './engine/themes/themePresets';
import { generateProgression } from './engine/harmony/generator';
import { MoodArchetype } from './engine/harmony/types';
import { ProgressionTimeline } from './types/music';

export type InstrumentMode = 'guitar' | 'keyboard';

/**
 * Minimalist Instagram Icon.
 */
const InstagramIcon: React.FC<{ className?: string }> = ({
  className = 'w-3.5 h-3.5',
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden="true"
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

/**
 * Formats duration in seconds to standard MM:SS string notation.
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

const MOODS: { id: MoodArchetype; label: string }[] = [
  { id: 'dreamy-major', label: 'Dreamy Major' },
  { id: 'melancholy-minor', label: 'Melancholy Minor' },
  { id: 'spicy-altered', label: 'Spicy Altered' },
  { id: 'smooth-rnb', label: 'Smooth R&B' },
];

/**
 * Swan Glide Visualizer application.
 *
 * Implements a serene, editorial neo-soul chord and voice-leading visualizer
 * inspired by Swan Glide and @ultraviolet_chorus:
 * - Quiet, refined design without AI dashboard slop or fake phone bezels
 * - The 9:16 vertical video visualizer is the pure, unobstructed hero
 * - Tactile, responsive floating dock for transport, harmony generator, and themes
 * - Real-time animated spline ribbons, centered fretboard, and illuminated keyboard
 */
export const App: React.FC = () => {
  const [currentProgression, setCurrentProgression] =
    useState<ProgressionTimeline>(mockProgression);
  const [themeId, setThemeId] = useState<ThemePresetId>('pastel');
  const [instrumentMode, setInstrumentMode] =
    useState<InstrumentMode>('guitar');
  const [selectedMood, setSelectedMood] =
    useState<MoodArchetype>('dreamy-major');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [copiedCaption, setCopiedCaption] = useState<boolean>(false);

  const themePreset = useMemo(() => getThemePreset(themeId), [themeId]);
  const isDark = themePreset.isDark;

  const {
    isPlaying,
    progress,
    currentChordIndex,
    currentStep,
    isMuted,
    audioMode,
    setAudioMode,
    startAudio,
    togglePlay,
    seek,
    toggleMute,
    audioElement,
  } = useAudioPlayback(currentProgression);

  const totalDurationSeconds = useMemo(() => {
    return currentProgression.getTotalDurationSeconds() || 24;
  }, [currentProgression]);

  const elapsedSeconds = useMemo(() => {
    return Math.max(0, Math.min(1, progress)) * totalDurationSeconds;
  }, [progress, totalDurationSeconds]);

  const handleTogglePlay = useCallback(async () => {
    try {
      await startAudio();
      await togglePlay();
    } catch (error) {
      console.error('Audio toggle error:', error);
    }
  }, [startAudio, togglePlay]);

  const handleRestart = useCallback(() => {
    seek(0);
  }, [seek]);

  // Procedural neo-soul progression generation
  const handleGenerateSong = useCallback(async () => {
    try {
      setIsGenerating(true);
      const generated = generateProgression({ mood: selectedMood });
      setCurrentProgression(generated);
      setAudioMode('synth');
      seek(0);
    } catch (error) {
      console.error('Progression generation error:', error);
    } finally {
      setTimeout(() => setIsGenerating(false), 250);
    }
  }, [selectedMood, seek, setAudioMode]);

  // Copy Instagram Caption to Clipboard
  const handleCopyCaption = useCallback(() => {
    const key = currentProgression.metadata?.key || 'D♭';
    const chordsList = currentProgression.steps
      .map((s, i) => `  ${i + 1}. ${s.chordName}`)
      .join('\n');

    const caption = `🎵 Neo-Soul Progression (in ${key})
Tempo: ${currentProgression.bpm} BPM

Harmonic Breakdown:
${chordsList}

Voice-Leading Analysis:
Minimal displacement voice-leading gliding between chord voicings.

Visualizer: Swan Glide × @ultraviolet_chorus 🕊️✨

#neosoul #chords #jazzharmony #pianochords #guitarchords #swanglide #ultravioletchorus`;

    navigator.clipboard.writeText(caption);
    setCopiedCaption(true);
    setTimeout(() => setCopiedCaption(false), 2000);
  }, [currentProgression]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLSelectElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        handleRestart();
      } else if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        handleGenerateSong();
      } else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setInstrumentMode((prev) => (prev === 'guitar' ? 'keyboard' : 'guitar'));
      } else if (e.key === 'm' || e.key === 'M') {
        e.preventDefault();
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleTogglePlay, handleRestart, handleGenerateSong, toggleMute]);

  return (
    <div className="h-screen w-full bg-[#0E0D12] text-[#ECE7F2] flex flex-col items-center justify-between p-2 sm:p-4 antialiased select-none overflow-hidden">
      {/* Top Subtle Brand Bar */}
      <header className="w-full max-w-4xl flex items-center justify-between px-3 py-1.5 z-30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-bold text-sm tracking-tight text-white/90">
            Swan Glide
          </span>
          <span className="text-white/30 text-xs font-light">×</span>
          <a
            href="https://www.instagram.com/ultraviolet_chorus/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-white/70 hover:text-white transition-colors flex items-center gap-1.5"
            title="Visit @ultraviolet_chorus on Instagram"
          >
            <InstagramIcon className="text-pink-400/80" />
            <span>@ultraviolet_chorus</span>
            <ExternalLink className="w-2.5 h-2.5 text-white/30" />
          </a>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopyCaption}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-medium transition-all cursor-pointer border border-white/10"
            title="Copy Instagram caption & hashtags"
          >
            {copiedCaption ? (
              <>
                <Check className="w-3 h-3 text-emerald-400" />
                <span className="text-emerald-400">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3 text-white/60" />
                <span>Caption</span>
              </>
            )}
          </button>

          <VideoExporter
            progression={currentProgression}
            theme={themePreset}
            instrument={instrumentMode}
            audioElement={audioElement}
          />
        </div>
      </header>

      {/* Centerpiece 9:16 Portrait Visualizer Canvas */}
      <main
        className={clsx(
          'w-auto aspect-[9/16] h-[66vh] sm:h-[72vh] max-h-[760px] max-w-full rounded-2xl sm:rounded-3xl overflow-hidden relative flex flex-col justify-between transition-all duration-500 shadow-2xl shrink-0 my-auto',
          themePreset.backgroundClass,
          themePreset.containerBorderClass,
          themePreset.containerShadowClass
        )}
      >
        {/* Top Section: Hero Chord Typography & Step Dots */}
        <div className="shrink-0 z-10 pt-2">
          <HeaderChordDisplay
            currentStep={currentStep}
            stepIndex={currentChordIndex}
            totalSteps={currentProgression.steps.length}
            theme={themePreset}
          />
        </div>

        {/* Center Section: Voice-Leading Spline Timeline Canvas */}
        <div className="flex-1 w-full min-h-0 relative flex items-center justify-center my-0.5">
          <VoiceLeadingCanvas
            progression={currentProgression}
            progress={progress}
            theme={themePreset}
            onSeek={seek}
            playheadRatio={0.37}
            className="w-full h-full"
          />

          {/* Initial Tap-to-Play Overlay */}
          {!isPlaying && progress === 0 && (
            <button
              type="button"
              onClick={handleTogglePlay}
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[1.5px] cursor-pointer group transition-all"
              aria-label="Start playback"
            >
              <div
                className={clsx(
                  'flex items-center gap-2 px-6 py-2.5 rounded-full font-semibold text-xs tracking-wide shadow-xl transition-all duration-300 group-hover:scale-105 border',
                  isDark
                    ? 'bg-white/10 text-white border-white/20 backdrop-blur-md'
                    : 'bg-[#240A34] text-white border-purple-950/20'
                )}
              >
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                <span>Tap to Play</span>
              </div>
            </button>
          )}
        </div>

        {/* Bottom Section: Centered Guitar Fretboard or Piano Keyboard */}
        <div className="shrink-0 z-10 pb-3">
          {instrumentMode === 'guitar' ? (
            <GuitarFretboard
              voicing={currentStep.guitarDiagram}
              chordName={currentStep.chordName}
              theme={themePreset}
            />
          ) : (
            <KeyboardDiagram
              step={currentStep}
              theme={themePreset}
            />
          )}
        </div>
      </main>

      {/* Floating Bottom Studio Dock */}
      <nav
        aria-label="Studio controls"
        className="w-full max-w-xl z-30 shrink-0 p-2 sm:p-2.5 rounded-2xl bg-zinc-900/90 backdrop-blur-xl border border-white/10 text-white shadow-2xl flex flex-col gap-2"
      >
        {/* Row 1: Scrubber and Duration */}
        <div className="w-full flex items-center gap-3 px-2">
          {/* Play / Pause button */}
          <button
            type="button"
            onClick={handleTogglePlay}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-zinc-950 hover:scale-105 transition-transform cursor-pointer shadow-sm shrink-0"
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5 fill-current" />
            ) : (
              <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
            )}
          </button>

          {/* Restart */}
          <button
            type="button"
            onClick={handleRestart}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Restart Progression (R)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Interactive Timeline Scrubber */}
          <div
            className="flex-1 h-2 rounded-full bg-white/15 relative cursor-pointer group"
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const ratio = (e.clientX - rect.left) / rect.width;
              seek(Math.max(0, Math.min(1, ratio)));
            }}
          >
            <div
              className="h-full rounded-full bg-purple-400 relative transition-all duration-75"
              style={{
                width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white opacity-0 group-hover:opacity-100 transition-opacity shadow-sm" />
            </div>
          </div>

          {/* Time Display */}
          <span className="text-[11px] font-mono font-medium text-white/60 shrink-0">
            {formatTime(elapsedSeconds)} / {formatTime(totalDurationSeconds)}
          </span>

          {/* Mute */}
          <button
            type="button"
            onClick={toggleMute}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors cursor-pointer shrink-0"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-400" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>

        {/* Row 2: Instrument, Mood Generator, Sound Engine, and Themes */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10 overflow-x-auto no-scrollbar">
          {/* Instrument Toggle */}
          <div className="flex items-center p-0.5 rounded-full bg-white/10 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setInstrumentMode('guitar')}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer',
                instrumentMode === 'guitar'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              )}
            >
              <Guitar className="w-3 h-3 text-cyan-300" />
              <span>Guitar</span>
            </button>

            <button
              type="button"
              onClick={() => setInstrumentMode('keyboard')}
              className={clsx(
                'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all cursor-pointer',
                instrumentMode === 'keyboard'
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/60 hover:text-white'
              )}
            >
              <Piano className="w-3 h-3 text-amber-300" />
              <span>Piano</span>
            </button>
          </div>

          {/* Mood Archetype Selector */}
          <div className="flex items-center gap-1.5">
            <select
              value={selectedMood}
              onChange={(e) => setSelectedMood(e.target.value as MoodArchetype)}
              className="px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-white border-none outline-none cursor-pointer"
              title="Select Mood Archetype"
            >
              {MOODS.map((m) => (
                <option key={m.id} value={m.id} className="bg-zinc-900 text-white">
                  {m.label}
                </option>
              ))}
            </select>

            {/* Generate Button */}
            <button
              type="button"
              onClick={handleGenerateSong}
              disabled={isGenerating}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[11px] font-semibold text-white transition-all cursor-pointer border border-white/10"
              title="Generate new progression (G)"
            >
              <Wand2 className={clsx('w-3 h-3 text-purple-300', isGenerating && 'animate-spin')} />
              <span>{isGenerating ? 'Synthesizing...' : 'New Chords'}</span>
            </button>
          </div>

          {/* Audio Engine Toggle */}
          <button
            type="button"
            onClick={() =>
              setAudioMode(audioMode === 'studio' ? 'synth' : 'studio')
            }
            className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/15 text-[11px] font-semibold text-white/80 hover:text-white transition-colors cursor-pointer"
            title="Toggle Studio Reference Track vs Live Synth Engine"
          >
            <span>{audioMode === 'studio' ? 'Rhodes Audio' : 'Tone.js Synth'}</span>
          </button>

          {/* Theme Palette Swatches */}
          <div className="flex items-center gap-1.5">
            {THEME_PRESETS_LIST.map((preset) => {
              const isSelected = themeId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => setThemeId(preset.id)}
                  className={clsx(
                    'w-5 h-5 rounded-full transition-all cursor-pointer',
                    isSelected
                      ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110'
                      : 'opacity-65 hover:opacity-100 hover:scale-105'
                  )}
                  style={{
                    background: preset.backgroundGradientCss,
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                  }}
                  title={preset.name}
                  aria-label={`Select ${preset.name} theme`}
                />
              );
            })}
          </div>
        </div>
      </nav>

      {/* Footer Attributions */}
      <footer className="w-full max-w-4xl px-3 py-1 hidden sm:flex items-center justify-between text-[11px] text-white/40 shrink-0">
        <div>Swan Glide × @ultraviolet_chorus</div>
        <div>Shortcuts: Space (Play), R (Restart), G (New Chords), I (Instrument), M (Mute)</div>
      </footer>
    </div>
  );
};

export default App;
