import React, { useMemo } from 'react';
import clsx from 'clsx';
import { ChordStep } from '../types/music';
import { getThemePreset, ThemePreset } from '../engine/themes/themePresets';

/**
 * Props for the HeaderChordDisplay component.
 */
export interface HeaderChordDisplayProps {
  currentStep: ChordStep;
  stepIndex: number;
  totalSteps: number;
  theme?: string | ThemePreset;
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
  const preset: ThemePreset = useMemo(() => {
    if (typeof theme === 'string') {
      return getThemePreset(theme);
    }
    return theme;
  }, [theme]);

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
          className="text-7xl sm:text-8xl font-black tracking-tight transition-colors duration-200"
          style={{ color: preset.textColor }}
        >
          {root}
        </span>

        {/* Superscript Accidental (b or #) */}
        {accidental && (
          <sup
            className="text-3xl sm:text-4xl font-bold -top-4 sm:-top-5 ml-0.5 transition-colors duration-200"
            style={{ color: preset.accentColor }}
          >
            {accidental === 'b' ? '♭' : '♯'}
          </sup>
        )}

        {/* Chord Extension / Quality */}
        {extension && (
          <span
            className="text-4xl sm:text-5xl font-semibold tracking-tight self-end mb-1 sm:mb-2 ml-1 transition-colors duration-200"
            style={{ color: preset.textColor }}
          >
            {extension}
          </span>
        )}
      </div>

      {/* Subtitle Artist Attribution Handle */}
      <div
        className="mt-2 text-sm sm:text-base font-medium tracking-wide transition-colors duration-200"
        style={{ color: preset.textMutedColor }}
      >
        {currentStep.artistHandle || '@ultravioletchorus'}
      </div>
    </header>
  );
};
