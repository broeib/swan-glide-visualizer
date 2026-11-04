import React, { useCallback, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Eye,
  EyeOff,
  Guitar,
  Piano,
  Wand2,
  Palette,
  Music,
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
 * Swan Glide Visualizer application.
 *
 * Implements an authentic 9:16 viral vertical video visualizer
 * featuring procedural neo-soul harmony generation, continuous spline ribbons,
 * synchronized Rhodes audio synthesis, and interchangeable Guitar and Piano
 * Keyboard diagrams across 5 rich aesthetic themes.
 */
export const App: React.FC = () => {
  const [currentProgression, setCurrentProgression] =
    useState<ProgressionTimeline>(mockProgression);
  const [themeId, setThemeId] = useState<ThemePresetId>('pastel');
  const [instrumentMode, setInstrumentMode] =
    useState<InstrumentMode>('guitar');
  const [selectedMood, setSelectedMood] =
    useState<MoodArchetype>('dreamy-major');
  const [showControls, setShowControls] = useState<boolean>(true);

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
      const generated = generateProgression({ mood: selectedMood });
      setCurrentProgression(generated);
      // Generated progressions use procedural Tone.js Rhodes synthesis
      setAudioMode('synth');
      seek(0);
    } catch (error) {
      console.error('Progression generation error:', error);
    }
  }, [selectedMood, seek, setAudioMode]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-0 sm:p-4 md:p-6 antialiased select-none overflow-x-hidden">
      {/* Main 9:16 Portrait Canvas Shell */}
      <main
        className={clsx(
          'w-full h-[100dvh] sm:h-[92vh] max-w-[430px] aspect-[9/16] rounded-none sm:rounded-3xl shadow-2xl relative flex flex-col justify-between overflow-hidden transition-all duration-500',
          themePreset.backgroundClass,
          themePreset.containerBorderClass,
          themePreset.containerShadowClass,
        )}
      >
        {/* Top Section: Hero Chord Typography and Subtitle */}
        <div className="shrink-0 z-10 pt-2">
          <HeaderChordDisplay
            currentStep={currentStep}
            stepIndex={currentChordIndex}
            totalSteps={currentProgression.steps.length}
            theme={themePreset}
          />
        </div>

        {/* Center Section: Voice-Leading Spline Timeline Canvas */}
        <div className="flex-1 w-full min-h-0 relative flex items-center justify-center my-1">
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
              className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/10 backdrop-blur-[2px] cursor-pointer group transition-all"
              aria-label="Start playback"
            >
              <div
                className={clsx(
                  'flex items-center gap-2.5 px-5 py-2.5 rounded-full font-bold text-sm shadow-xl transition-all duration-300 group-hover:scale-105',
                  isDark
                    ? 'bg-amber-400 text-zinc-950 shadow-amber-500/20'
                    : 'bg-[#2E104D] text-white shadow-purple-950/20',
                )}
              >
                <Play className="w-4 h-4 fill-current" />
                <span>Tap to Play</span>
              </div>
            </button>
          )}
        </div>

        {/* Bottom Section: Instrument Diagram (Guitar or Keyboard) */}
        <div className="shrink-0 z-10 pb-4">
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

        {/* Floating Comprehensive Controls Bar */}
        {showControls && (
          <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-col gap-2 p-2.5 rounded-2xl bg-black/75 backdrop-blur-xl border border-white/10 text-white shadow-2xl transition-all duration-300">
            {/* Row 1: Playback, Audio Source, Instrument Mode, and Mute */}
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              <div className="flex items-center gap-1.5">
                {/* Play / Pause button */}
                <button
                  type="button"
                  onClick={handleTogglePlay}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-white text-zinc-950 hover:scale-105 transition-transform cursor-pointer shadow"
                  aria-label={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-3.5 h-3.5 fill-current" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  )}
                </button>

                {/* Restart button */}
                <button
                  type="button"
                  onClick={handleRestart}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title="Restart Progression"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                {/* Audio Mode toggle */}
                <button
                  type="button"
                  onClick={() =>
                    setAudioMode(audioMode === 'studio' ? 'synth' : 'studio')
                  }
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white transition-colors cursor-pointer"
                  title="Toggle Studio Reference Track vs Live Synth Engine"
                >
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  <span>{audioMode === 'studio' ? 'Studio' : 'Synth'}</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {/* Instrument Mode Toggle (Guitar vs Piano Keyboard) */}
                <button
                  type="button"
                  onClick={() =>
                    setInstrumentMode((prev) =>
                      prev === 'guitar' ? 'keyboard' : 'guitar',
                    )
                  }
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white transition-colors cursor-pointer"
                  title="Toggle Guitar Diagram vs Piano Keyboard Diagram"
                >
                  {instrumentMode === 'guitar' ? (
                    <>
                      <Guitar className="w-3 h-3 text-cyan-300" />
                      <span>Guitar</span>
                    </>
                  ) : (
                    <>
                      <Piano className="w-3 h-3 text-amber-300" />
                      <span>Piano</span>
                    </>
                  )}
                </button>

                {/* Mute toggle */}
                <button
                  type="button"
                  onClick={toggleMute}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                  title={isMuted ? 'Unmute' : 'Mute'}
                >
                  {isMuted ? (
                    <VolumeX className="w-3.5 h-3.5 text-rose-400" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>

            {/* Row 2: Harmony Generator, Mood Archetype, and Theme Presets */}
            <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/10">
              {/* Mood Archetype Selector */}
              <div className="relative flex items-center min-w-0">
                <Music className="w-3 h-3 text-indigo-300 absolute left-2 pointer-events-none" />
                <select
                  value={selectedMood}
                  onChange={(e) =>
                    setSelectedMood(e.target.value as MoodArchetype)
                  }
                  className="pl-6 pr-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white border-none outline-none cursor-pointer appearance-none truncate max-w-[125px]"
                  title="Select Mood Archetype"
                >
                  <option value="dreamy-major" className="bg-zinc-900 text-white">
                    Dreamy Major
                  </option>
                  <option
                    value="melancholy-minor"
                    className="bg-zinc-900 text-white"
                  >
                    Melancholy Minor
                  </option>
                  <option value="spicy-altered" className="bg-zinc-900 text-white">
                    Spicy Altered
                  </option>
                  <option value="smooth-rnb" className="bg-zinc-900 text-white">
                    Smooth R&amp;B
                  </option>
                </select>
              </div>

              {/* Generate Song Button */}
              <button
                type="button"
                onClick={handleGenerateSong}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-400 hover:to-pink-400 text-[11px] font-bold text-white shadow-sm hover:scale-105 transition-all cursor-pointer"
                title="Procedurally generate a new progression"
              >
                <Wand2 className="w-3 h-3" />
                <span>Generate</span>
              </button>

              {/* Theme Presets Selector */}
              <div className="relative flex items-center min-w-0">
                <Palette className="w-3 h-3 text-pink-300 absolute left-2 pointer-events-none" />
                <select
                  value={themeId}
                  onChange={(e) => setThemeId(e.target.value as ThemePresetId)}
                  className="pl-6 pr-2 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-semibold text-white border-none outline-none cursor-pointer appearance-none truncate max-w-[115px]"
                  title="Select Theme Preset"
                >
                  {THEME_PRESETS_LIST.map((preset) => (
                    <option
                      key={preset.id}
                      value={preset.id}
                      className="bg-zinc-900 text-white"
                    >
                      {preset.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Video Exporter and Hide Controls */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <VideoExporter
                progression={currentProgression}
                theme={isDark ? 'dark' : 'pastel'}
                audioElement={audioElement}
              />

              <button
                type="button"
                onClick={() => setShowControls(false)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full hover:bg-white/10 text-[11px] font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Hide controls for clean video preview"
              >
                <EyeOff className="w-3 h-3" />
                <span>Hide UI</span>
              </button>
            </div>
          </div>
        )}

        {/* Minimal Unhide Button when controls are hidden */}
        {!showControls && (
          <button
            type="button"
            onClick={() => setShowControls(true)}
            className="absolute bottom-3 right-3 z-30 p-2 rounded-full bg-black/40 hover:bg-black/60 text-white/80 hover:text-white backdrop-blur-md border border-white/10 shadow-lg transition-all cursor-pointer"
            title="Show Controls"
          >
            <Eye className="w-4 h-4" />
          </button>
        )}
      </main>
    </div>
  );
};

export default App;
