import React from 'react';
import clsx from 'clsx';
import { ChordStep } from '../types/music';

/**
 * Props for the HeaderChordDisplay component.
 */
export interface HeaderChordDisplayProps {
  currentStep: ChordStep;
  stepIndex: number;
  totalSteps: number;
  theme?: 'pastel' | 'dark';
  className?: string;
}

/**
 * Formats a chord name into root, accidental, and extension parts for hero typography.
 */
function parseChordDisplay(step: ChordStep): {
  root: string;
  accidental: string;
  extension: string;
} {
  if (step.chordRoot) {
    return {
      root: step.chordRoot,
      accidental: step.chordAccidental ?? '',
      extension: step.chordExtension ?? '',
    };
  }

  // Regex parse e.g. "Dbmaj9", "C7(#9)", "Fm9"
  const match = step.chordName.match(/^([A-G])([b#]?)(.*)$/);
  if (match && match[1]) {
    return {
      root: match[1],
      accidental: match[2] ?? '',
      extension: match[3] ?? '',
    };
  }

  return {
    root: step.chordName,
    accidental: '',
    extension: '',
  };
}

/**
 * HeaderChordDisplay component matching the Swan Glide video layout.
 *
 * Displays large hero chord typography (e.g. Dbmaj9, C7(#9), Fm9) with
 * superscript accidentals and clean artist attribution handle (@ultravioletchorus).
 */
export const HeaderChordDisplay: React.FC<HeaderChordDisplayProps> = ({
  currentStep,
  theme = 'pastel',
  className,
}) => {
  const { root, accidental, extension } = parseChordDisplay(currentStep);
  const isDark = theme === 'dark';

  return (
    <header
      className={clsx(
        'w-full flex flex-col items-center justify-center select-none pt-4 pb-2 transition-colors duration-300',
        className
      )}
    >
      {/* Hero Chord Typography */}
      <div className="flex items-start justify-center leading-none">
        {/* Large Root Letter */}
        <span
          className={clsx(
            'text-7xl sm:text-8xl font-black tracking-tight transition-colors duration-200',
            isDark ? 'text-white' : 'text-[#2E104D]'
          )}
        >
          {root}
        </span>

        {/* Superscript Accidental (b or #) */}
        {accidental && (
          <sup
            className={clsx(
              'text-3xl sm:text-4xl font-bold -top-4 sm:-top-5 ml-0.5 transition-colors duration-200',
              isDark ? 'text-amber-200' : 'text-[#2E104D]'
            )}
          >
            {accidental === 'b' ? '♭' : '♯'}
          </sup>
        )}

        {/* Chord Extension / Quality */}
        {extension && (
          <span
            className={clsx(
              'text-4xl sm:text-5xl font-semibold tracking-tight self-end mb-1 sm:mb-2 ml-1 transition-colors duration-200',
              isDark ? 'text-zinc-200' : 'text-[#2E104D]'
            )}
          >
            {extension}
          </span>
        )}
      </div>

      {/* Subtitle Artist Attribution Handle */}
      <div
        className={clsx(
          'mt-2 text-sm sm:text-base font-medium tracking-wide transition-colors duration-200',
          isDark ? 'text-zinc-400' : 'text-[#2E104D]/70'
        )}
      >
        {currentStep.artistHandle || '@ultravioletchorus'}
      </div>
    </header>
  );
};
