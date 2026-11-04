import React from 'react';
import clsx from 'clsx';
import { Sparkles } from 'lucide-react';
import { ChordStep } from '../types/music';

/**
 * Props for the HeaderChordDisplay component.
 */
export interface HeaderChordDisplayProps {
  /** Active chord step configuration in the playback progression. */
  currentStep: ChordStep;
  /** Zero-based index of the active chord step (e.g. 0 to 3). */
  stepIndex: number;
  /** Total number of chord steps in the progression timeline (e.g. 4). */
  totalSteps: number;
  /** Optional container class name. */
  className?: string;
}

/**
 * HeaderChordDisplay component.
 *
 * Renders hero chord typography, artist handle badge,
 * and animated segmented progression indicator pills reflecting the active step.
 */
export const HeaderChordDisplay: React.FC<HeaderChordDisplayProps> = ({
  currentStep,
  stepIndex,
  totalSteps,
  className,
}) => {
  const displaySteps = Math.max(1, totalSteps);
  const activeIndex = Math.max(0, Math.min(stepIndex, displaySteps - 1));

  return (
    <header
      className={clsx(
        'w-full flex flex-col gap-2 p-5 rounded-3xl bg-white/60 backdrop-blur-md border border-white/70 shadow-sm transition-all duration-300',
        className
      )}
    >
      {/* Top meta row: artist attribution handle and progression indicator pills */}
      <div className="flex items-center justify-between gap-3">
        {/* Subtitle handle with delicate typography and subtle badge */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-violet-100/70 border border-violet-200/60 text-[#2D1B4E] text-xs font-semibold tracking-wide transition-colors">
          <Sparkles className="w-3.5 h-3.5 text-violet-600" />
          <span>{currentStep.artistHandle || '@ultravioletchorus'}</span>
        </div>

        {/* Progression indicator pills: segmented indicators showing active chord position */}
        <div
          className="flex items-center gap-1.5"
          role="tablist"
          aria-label="Chord progression step indicator"
        >
          {Array.from({ length: displaySteps }).map((_, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={`progression-pill-${idx}`}
                className={clsx(
                  'h-2 rounded-full transition-all duration-300 ease-out',
                  isActive
                    ? 'w-8 bg-[#2D1B4E] shadow-sm'
                    : 'w-2.5 bg-[#2D1B4E]/20'
                )}
                aria-label={`Step ${idx + 1} of ${displaySteps}`}
                aria-current={isActive ? 'step' : undefined}
              />
            );
          })}
          <span className="text-xs font-bold font-mono text-[#2D1B4E]/60 ml-1.5">
            {activeIndex + 1}/{displaySteps}
          </span>
        </div>
      </div>

      {/* Hero chord typography */}
      <div className="mt-1 flex items-baseline justify-between gap-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight text-[#2D1B4E] transition-all duration-200">
          {currentStep.chordName || 'Voicing'}
        </h1>

        {/* Supplementary musical context */}
        <div className="flex items-center gap-2 text-xs font-semibold text-[#2D1B4E]/60">
          <span className="px-2 py-0.5 rounded-md bg-[#2D1B4E]/5 border border-[#2D1B4E]/10">
            {currentStep.voices.length} voices
          </span>
          <span className="px-2 py-0.5 rounded-md bg-[#2D1B4E]/5 border border-[#2D1B4E]/10">
            {currentStep.durationBeats} beats
          </span>
        </div>
      </div>
    </header>
  );
};
