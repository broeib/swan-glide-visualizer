import React, { useCallback, useMemo } from 'react';
import { Play } from 'lucide-react';
import { mockProgression } from './data/mockProgression';
import { useAudioPlayback } from './audio/useAudioPlayback';
import { VoiceLeadingCanvas } from './components/VoiceLeadingCanvas';
import { GuitarFretboard } from './components/GuitarFretboard';
import { HeaderChordDisplay } from './components/HeaderChordDisplay';
import { PlaybackControls } from './components/PlaybackControls';

/**
 * Swan Glide Visualizer main application.
 *
 * Integrates the continuous voice-leading spline canvas,
 * synchronized 6-string guitar chord voicing diagram,
 * top harmonic header, and transport playback controls
 * within an elegant 9:16 mobile-first portrait container.
 */
export const App: React.FC = () => {
  const {
    isPlaying,
    progress,
    currentChordIndex,
    currentStep,
    isMuted,
    startAudio,
    play,
    togglePlay,
    seek,
    toggleMute,
  } = useAudioPlayback(mockProgression);

  const totalDurationSeconds = useMemo(
    () => mockProgression.getTotalDurationSeconds(),
    []
  );

  const handleTogglePlay = useCallback(async () => {
    try {
      await startAudio();
      await togglePlay();
    } catch (error) {
      console.error('Audio transport toggle error:', error);
    }
  }, [startAudio, togglePlay]);

  const handleStartPlay = useCallback(async () => {
    try {
      await startAudio();
      await play();
    } catch (error) {
      console.error('Audio start error:', error);
    }
  }, [startAudio, play]);

  const handleSeek = useCallback(
    (newProgress: number) => {
      seek(newProgress);
    },
    [seek]
  );

  const handleRestart = useCallback(() => {
    seek(0);
  }, [seek]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-tr from-rose-100/70 via-purple-50 to-indigo-100/60 p-0 sm:p-4 md:p-6 antialiased selection:bg-rose-200">
      {/* Decorative ambient background blur orbs on desktop */}
      <div
        className="fixed top-1/4 left-1/4 w-96 h-96 rounded-full bg-pink-200/40 blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2"
        aria-hidden="true"
      />
      <div
        className="fixed bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-purple-200/40 blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2"
        aria-hidden="true"
      />

      {/* Main 9:16 portrait visualizer card container */}
      <main className="w-full h-[100dvh] sm:h-auto max-w-[420px] sm:aspect-[9/16] sm:max-h-[880px] rounded-none sm:rounded-3xl shadow-2xl shadow-purple-950/15 overflow-hidden relative flex flex-col border-0 sm:border border-white/60 bg-gradient-to-br from-pink-100 via-rose-100 to-purple-200 p-3 sm:p-4 gap-2.5 backdrop-blur-xl">
        {/* Top: HeaderChordDisplay showing active chord, artist handle, and step pills */}
        <HeaderChordDisplay
          currentStep={currentStep}
          stepIndex={currentChordIndex}
          totalSteps={mockProgression.steps.length}
          className="shrink-0 !py-3 !px-4 !rounded-2xl shadow-sm"
        />

        {/* Middle Upper: VoiceLeadingCanvas continuous spline ribbons */}
        <div className="flex-1 min-h-0 w-full relative rounded-2xl overflow-hidden shadow-inner border border-white/60 bg-white/40 backdrop-blur-sm">
          <VoiceLeadingCanvas
            progression={mockProgression}
            progress={progress}
            onSeek={handleSeek}
            playheadRatio={0.35}
            className="!min-h-0 w-full h-full"
          />

          {/* Gesture onboarding prompt when audio is idle before first playback */}
          {!isPlaying && progress === 0 && (
            <button
              type="button"
              onClick={handleStartPlay}
              className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-violet-950/15 backdrop-blur-[2px] transition-all duration-300 hover:bg-violet-950/20 group cursor-pointer"
              aria-label="Start audio playback"
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 text-[#2D1B4E] font-medium text-xs shadow-lg shadow-purple-950/10 group-hover:scale-105 transition-transform duration-200 border border-white">
                <Play className="w-3.5 h-3.5 fill-violet-600 text-violet-600" />
                <span>Tap to Play</span>
              </div>
            </button>
          )}
        </div>

        {/* Middle Lower: GuitarFretboard chord box diagram */}
        <GuitarFretboard
          voicing={currentStep.guitarDiagram}
          chordName={currentStep.chordName}
          className="shrink-0 !py-2 !px-3 !rounded-2xl shadow-sm [&_svg]:max-w-[165px] [&_svg]:max-h-[170px]"
        />

        {/* Bottom: PlaybackControls with scrubber, play/pause, mute, and BPM badge */}
        <PlaybackControls
          isPlaying={isPlaying}
          isMuted={isMuted}
          progress={progress}
          bpm={mockProgression.bpm}
          totalDurationSeconds={totalDurationSeconds}
          onTogglePlay={handleTogglePlay}
          onToggleMute={toggleMute}
          onSeek={handleSeek}
          onRestart={handleRestart}
          className="shrink-0 !py-3 !px-4 !rounded-2xl !gap-2 shadow-sm"
        />
      </main>
    </div>
  );
};

export default App;
