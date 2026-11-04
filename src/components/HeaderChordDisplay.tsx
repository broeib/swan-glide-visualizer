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
 * HeaderChordDisplay component matching the iconic UltraViolet Chorus visualizer aesthetic.
 *
 * Displays statuesque hero chord typography (e.g. Dbmaj9, C7(#9), Fm9) with
 * optically aligned accidentals, harmonic step progression dots, and a
 * verified artist attribution badge.
 */
export const HeaderChordDisplay: React.FC<HeaderChordDisplayProps> = ({
  currentStep,
  stepIndex,
  totalSteps,
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

  // Normalized accidental glyph
  const formattedAccidental =
    accidental === 'b' ? '♭' : accidental === '#' ? '♯' : accidental;

  return (
    <header
      className={clsx(
        'w-full flex flex-col items-center justify-center select-none pt-3 pb-2 transition-colors duration-300',
        className
      )}
    >
      {/* Top Micro-Header: Harmonic Step Indicators */}
      <div className="flex items-center gap-1.5 mb-2">
        {Array.from({ length: Math.max(totalSteps, 4) }).map((_, idx) => {
          const isActive = idx === stepIndex;
          return (
            <div
              key={`step-dot-${idx}`}
              className={clsx(
                'h-1.5 rounded-full transition-all duration-300',
                isActive ? 'w-6 opacity-100' : 'w-2 opacity-30'
              )}
              style={{
                backgroundColor: isActive ? preset.accentColor : preset.textColor,
                boxShadow: isActive ? `0 0 10px ${preset.accentColor}` : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Hero Chord Typography */}
      <div className="inline-flex items-baseline justify-center font-display tracking-tight leading-none px-4">
        {/* Large Root Letter */}
        <span
          className="text-7xl sm:text-8xl font-black tracking-tight transition-colors duration-200 drop-shadow-sm"
          style={{ color: preset.textColor }}
        >
          {root}
        </span>

        {/* Accidental (♭ or ♯) positioned naturally beside Root */}
        {formattedAccidental && (
          <span
            className="text-4xl sm:text-5xl font-extrabold tracking-tighter px-0.5 self-start mt-1 transition-colors duration-200"
            style={{ color: preset.accentColor }}
          >
            {formattedAccidental}
          </span>
        )}

        {/* Chord Extension / Quality */}
        {extension && (
          <span
            className="text-4xl sm:text-5xl font-bold tracking-tight ml-1.5 transition-colors duration-200"
            style={{ color: preset.textColor }}
          >
            {extension}
          </span>
        )}
      </div>
    </header>
  );
};
