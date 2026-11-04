import React, { useCallback, useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Sparkles,
  Sun,
  Moon,
  Eye,
  EyeOff,
} from 'lucide-react';
import clsx from 'clsx';
import { mockProgression } from './data/mockProgression';
import { useAudioPlayback } from './audio/useAudioPlayback';
import { VoiceLeadingCanvas } from './components/VoiceLeadingCanvas';
import { GuitarFretboard } from './components/GuitarFretboard';
import { HeaderChordDisplay } from './components/HeaderChordDisplay';
import { VideoExporter } from './components/VideoExporter';

/**
 * Swan Glide Visualizer application.
 *
 * Implements an exact 1:1 replica of the viral Swan Glide / @ultravioletchorus
 * 9:16 video aesthetic, with authentic studio Rhodes audio synchronization,
 * continuous voice-leading ribbons, and direct 1080x1920 video export.
 */
export const App: React.FC = () => {
  const [theme, setTheme] = useState<'pastel' | 'dark'>('pastel');
  const [showControls, setShowControls] = useState<boolean>(true);

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
  } = useAudioPlayback(mockProgression);

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

  const isDark = theme === 'dark';

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-zinc-950 p-0 sm:p-4 md:p-6 antialiased select-none overflow-x-hidden">
      {/* Main 9:16 Portrait Canvas Shell */}
      <main
        className={clsx(
          'w-full h-[100dvh] sm:h-[92vh] max-w-[430px] aspect-[9/16] rounded-none sm:rounded-3xl shadow-2xl relative flex flex-col justify-between overflow-hidden transition-colors duration-500',
          isDark
            ? 'bg-gradient-to-b from-[#1c0808] via-[#120404] to-[#0a0202] text-white shadow-black/80 sm:border sm:border-zinc-800'
            : 'bg-gradient-to-b from-[#fad4e6] via-[#f7cfe3] to-[#fad6e8] text-[#2E104D] shadow-purple-950/25 sm:border sm:border-white/50',
        )}
      >
        {/* Top Section: Hero Chord Typography & Subtitle */}
        <div className="shrink-0 z-10 pt-2">
          <HeaderChordDisplay
            currentStep={currentStep}
            stepIndex={currentChordIndex}
            totalSteps={mockProgression.steps.length}
            theme={theme}
          />
        </div>

        {/* Center Section: Voice-Leading Spline Timeline Canvas */}
        <div className="flex-1 w-full min-h-0 relative flex items-center justify-center my-1">
          <VoiceLeadingCanvas
            progression={mockProgression}
            progress={progress}
            theme={theme}
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

        {/* Bottom Section: Guitar Fretboard & Brand Attribution */}
        <div className="shrink-0 z-10 pb-4">
          <GuitarFretboard
            voicing={currentStep.guitarDiagram}
            chordName={currentStep.chordName}
            theme={theme}
          />
        </div>

        {/* Floating Minimal Controls Bar */}
        {showControls && (
          <div className="absolute bottom-3 left-3 right-3 z-30 flex flex-col gap-2 p-2.5 rounded-2xl bg-black/60 backdrop-blur-xl border border-white/10 text-white shadow-2xl transition-all duration-300">
            {/* Top row controls */}
            <div className="flex items-center justify-between gap-2">
              {/* Play / Pause button */}
              <button
                type="button"
                onClick={handleTogglePlay}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-white text-zinc-950 hover:scale-105 transition-transform cursor-pointer shadow"
                aria-label={isPlaying ? 'Pause' : 'Play'}
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4 fill-current" />
                ) : (
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                )}
              </button>

              {/* Restart button */}
              <button
                type="button"
                onClick={handleRestart}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Restart Progression"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Audio Source mode toggle */}
              <button
                type="button"
                onClick={() => setAudioMode(audioMode === 'studio' ? 'synth' : 'studio')}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition-colors cursor-pointer"
                title="Toggle Studio Audio vs Synth Mode"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>{audioMode === 'studio' ? 'Studio Track' : 'Synth Mode'}</span>
              </button>

              {/* Theme toggle */}
              <button
                type="button"
                onClick={() => setTheme(isDark ? 'pastel' : 'dark')}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title="Switch Theme (Pastel / Neon Dark)"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-300" /> : <Moon className="w-4 h-4 text-purple-300" />}
              </button>

              {/* Mute toggle */}
              <button
                type="button"
                onClick={toggleMute}
                className="p-2 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Bottom row: Video Exporter & Hide Controls */}
            <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10">
              <VideoExporter
                progression={mockProgression}
                theme={theme}
                audioElement={audioElement}
              />

              <button
                type="button"
                onClick={() => setShowControls(false)}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full hover:bg-white/10 text-[11px] font-medium text-white/70 hover:text-white transition-colors cursor-pointer"
                title="Hide controls for clean video preview"
              >
                <EyeOff className="w-3.5 h-3.5" />
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
