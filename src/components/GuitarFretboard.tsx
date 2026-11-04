import React, { useMemo } from 'react';
import clsx from 'clsx';
import { Barre, GuitarChordVoicing } from '../types/music';
import { getThemePreset, ThemePreset } from '../engine/themes/themePresets';

/**
 * Props for the GuitarFretboard chord diagram component.
 */
export interface GuitarFretboardProps {
  /** 6-string guitar chord voicing configuration. */
  voicing: GuitarChordVoicing;
  /** Primary chord symbol displayed in the header label (e.g. "Fm9"). */
  chordName: string;
  /** Visual theme identifier or ThemePreset. */
  theme?: string | ThemePreset;
  /** Optional container class name. */
  className?: string;
}

/**
 * Layout constants for the spacious SVG fretboard diagram.
 */
const NUM_STRINGS = 6;
const NUM_FRETS = 5;

const STRING_START_X = 42;
const STRING_SPACING = 27;
const STRING_END_X = STRING_START_X + (NUM_STRINGS - 1) * STRING_SPACING; // 177

const NUT_Y = 32;
const FRET_SPACING = 25;
const FRETBOARD_BOTTOM_Y = NUT_Y + NUM_FRETS * FRET_SPACING; // 157

const TOP_MARKER_Y = 16;
const BOTTOM_LABEL_Y = 176;

function getStringX(index: number): number {
  return STRING_START_X + index * STRING_SPACING;
}

function getFretCenterY(relativeFret: number): number {
  return NUT_Y + (relativeFret - 0.5) * FRET_SPACING;
}

function stringNumberToIndex(stringNum: number): number {
  return 6 - Math.max(1, Math.min(6, stringNum));
}

function formatNoteGlyph(note: string): string {
  return note.replace('#', '♯').replace('b', '♭');
}

/**
 * SVG-based Guitar Chord Diagram matching the iconic UltraViolet Chorus visualizer.
 *
 * Displays bone nut, fret wires, pearloid inlay dots, finger positions,
 * string note badges, and subtle watermark branding.
 */
export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({
  voicing,
  chordName,
  theme = 'pastel',
  className,
}) => {
  const preset: ThemePreset = useMemo(() => {
    if (typeof theme === 'string') {
      return getThemePreset(theme);
    }
    return theme;
  }, [theme]);

  const baseFret = voicing.baseFret ?? 1;
  const isNutVisible = baseFret <= 1;
  const barres = voicing.barres ?? [];

  const isDark = preset.isDark;
  const mainColor = preset.textColor;
  const mutedColor = preset.textMutedColor;
  const gridLineColor = isDark
    ? 'rgba(255, 255, 255, 0.20)'
    : 'rgba(36, 10, 52, 0.22)';
  const inlayDotColor = isDark
    ? 'rgba(255, 255, 255, 0.12)'
    : 'rgba(36, 10, 52, 0.08)';

  // Inlay marker positions (3rd, 5th, 7th, 9th, 12th frets)
  const fretCenterStringX = (getStringX(2) + getStringX(3)) / 2;

  return (
    <div
      className={clsx(
        'w-full flex flex-col items-center justify-center px-4 py-1 select-none transition-colors duration-300',
        className
      )}
    >
      {/* Top Header Bar */}
      <div className="w-full max-w-[280px] flex items-center justify-between px-1 mb-1">
        <span
          className="text-[10px] font-bold tracking-widest uppercase transition-colors duration-200"
          style={{ color: mutedColor }}
        >
          GUITAR VOICING
        </span>
        <span
          className="text-[10px] font-semibold tracking-wide transition-colors duration-200"
          style={{ color: mutedColor }}
        >
          {chordName}
        </span>
      </div>

      {/* Centered High-Definition Guitar SVG */}
      <div className="relative flex items-center justify-center">
        <svg
          viewBox="0 0 220 190"
          className="w-[240px] sm:w-[260px] h-auto overflow-visible"
          aria-label={`Guitar chord diagram for ${chordName}`}
          role="img"
        >
          <defs>
            <filter id="fret-shadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="1.5"
                stdDeviation="1.5"
                floodColor={mainColor}
                floodOpacity={isDark ? '0.45' : '0.22'}
              />
            </filter>

            <filter id="nut-shadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="1"
                stdDeviation="1"
                floodColor={mainColor}
                floodOpacity={isDark ? '0.5' : '0.25'}
              />
            </filter>
          </defs>

          {/* Fretboard Inlay Marker Dots (3, 5, 7, 9 relative to baseFret) */}
          {[3, 5, 7, 9].map((absFret) => {
            const relFret = absFret - baseFret + 1;
            if (relFret >= 1 && relFret <= NUM_FRETS) {
              return (
                <circle
                  key={`inlay-${absFret}`}
                  cx={fretCenterStringX}
                  cy={getFretCenterY(relFret)}
                  r={3.5}
                  fill={inlayDotColor}
                />
              );
            }
            return null;
          })}

          {/* Fret position indicator (e.g. "3fr", "4fr") shown when baseFret > 1 */}
          {!isNutVisible && (
            <text
              x={STRING_START_X - 10}
              y={getFretCenterY(1) + 4}
              textAnchor="end"
              fill={preset.accentColor}
              className="font-bold font-mono text-[11px] select-none"
            >
              {baseFret}fr
            </text>
          )}

          {/* Top nut or first fret line */}
          {isNutVisible ? (
            <rect
              x={STRING_START_X - 2}
              y={NUT_Y - 3}
              width={STRING_END_X - STRING_START_X + 4}
              height={5.5}
              rx={2}
              fill={mainColor}
              filter="url(#nut-shadow)"
            />
          ) : (
            <line
              x1={STRING_START_X}
              y1={NUT_Y}
              x2={STRING_END_X}
              y2={NUT_Y}
              stroke={mainColor}
              strokeWidth={2}
              strokeLinecap="round"
            />
          )}

          {/* Horizontal fret lines */}
          {Array.from({ length: NUM_FRETS }).map((_, i) => {
            const fretWireY = NUT_Y + (i + 1) * FRET_SPACING;
            return (
              <line
                key={`fret-wire-${i + 1}`}
                x1={STRING_START_X}
                y1={fretWireY}
                x2={STRING_END_X}
                y2={fretWireY}
                stroke={gridLineColor}
                strokeWidth={1.2}
              />
            );
          })}

          {/* Vertical string lines with realistic gauge gradation */}
          {Array.from({ length: NUM_STRINGS }).map((_, i) => {
            const x = getStringX(i);
            // Low E (index 0) is thickest; High E (index 5) is slimmest
            const strokeWidth = 1.0 + (NUM_STRINGS - 1 - i) * 0.25;
            return (
              <line
                key={`string-line-${i}`}
                x1={x}
                y1={NUT_Y}
                x2={x}
                y2={FRETBOARD_BOTTOM_Y}
                stroke={gridLineColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
              />
            );
          })}

          {/* Barre pills */}
          {barres.map((barre: Barre, barreIdx: number) => {
            const fromIdx = stringNumberToIndex(barre.fromString);
            const toIdx = stringNumberToIndex(barre.toString);
            const minIdx = Math.min(fromIdx, toIdx);
            const maxIdx = Math.max(fromIdx, toIdx);

            const startX = getStringX(minIdx) - 8;
            const endX = getStringX(maxIdx) + 8;
            const pillWidth = endX - startX;
            const pillHeight = 13;

            const relFret = barre.fret - baseFret + 1;
            if (relFret < 1 || relFret > NUM_FRETS) {
              return null;
            }

            const centerY = getFretCenterY(relFret);

            return (
              <rect
                key={`barre-${barreIdx}`}
                x={startX}
                y={centerY - pillHeight / 2}
                width={pillWidth}
                height={pillHeight}
                rx={pillHeight / 2}
                ry={pillHeight / 2}
                fill={mainColor}
                filter="url(#fret-shadow)"
                className="transition-all duration-200"
              />
            );
          })}

          {/* Top markers (x for mute, o for open) */}
          {voicing.frets.map((fret, i) => {
            const x = getStringX(i);
            if (fret === 'x') {
              return (
                <g key={`top-marker-${i}`}>
                  <line
                    x1={x - 3.5}
                    y1={TOP_MARKER_Y - 3.5}
                    x2={x + 3.5}
                    y2={TOP_MARKER_Y + 3.5}
                    stroke={mutedColor}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                  <line
                    x1={x + 3.5}
                    y1={TOP_MARKER_Y - 3.5}
                    x2={x - 3.5}
                    y2={TOP_MARKER_Y + 3.5}
                    stroke={mutedColor}
                    strokeWidth={1.8}
                    strokeLinecap="round"
                  />
                </g>
              );
            }

            if (fret === 0) {
              return (
                <circle
                  key={`top-marker-${i}`}
                  cx={x}
                  cy={TOP_MARKER_Y}
                  r={4.2}
                  fill="none"
                  stroke={mainColor}
                  strokeWidth={1.8}
                />
              );
            }

            return null;
          })}

          {/* Finger dots */}
          {voicing.frets.map((fret, i) => {
            if (typeof fret !== 'number' || fret <= 0) {
              return null;
            }

            const relFret = fret - baseFret + 1;
            if (relFret < 1 || relFret > NUM_FRETS) {
              return null;
            }

            const cx = getStringX(i);
            const cy = getFretCenterY(relFret);

            return (
              <g key={`finger-dot-group-${i}`}>
                {/* Enamel Dot with Shadow */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={6.5}
                  fill={mainColor}
                  filter="url(#fret-shadow)"
                  className="transition-all duration-200 ease-out"
                />
                {/* Subtle center glint */}
                <circle
                  cx={cx - 1.5}
                  cy={cy - 1.5}
                  r={1.8}
                  fill="#FFFFFF"
                  fillOpacity={0.65}
                />
              </g>
            );
          })}

          {/* String note labels underneath */}
          {voicing.stringNotes.map((note, i) => {
            const x = getStringX(i);
            const isMuted = note === 'x' || voicing.frets[i] === 'x';
            return (
              <text
                key={`string-note-${i}`}
                x={x}
                y={BOTTOM_LABEL_Y}
                textAnchor="middle"
                fill={isMuted ? mutedColor : mainColor}
                className="text-[10px] font-bold font-mono select-none transition-colors duration-200"
              >
                {formatNoteGlyph(note)}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Subtle Bottom Attribution Pill */}
      <div className="flex items-center gap-1.5 mt-0.5 opacity-65 hover:opacity-100 transition-opacity">
        <span
          className="text-[9px] font-medium tracking-wider"
          style={{ color: mutedColor }}
        >
          SWAN GLIDE
        </span>
        <span className="text-[9px]" style={{ color: mutedColor }}>
          •
        </span>
        <span
          className="text-[9px] font-medium tracking-wider"
          style={{ color: mutedColor }}
        >
          @ultraviolet_chorus
        </span>
      </div>
    </div>
  );
};
