import React from 'react';
import clsx from 'clsx';
import { Barre, GuitarChordVoicing } from '../types/music';

/**
 * Props for the GuitarFretboard chord diagram component.
 */
export interface GuitarFretboardProps {
  /** 6-string guitar chord voicing configuration. */
  voicing: GuitarChordVoicing;
  /** Primary chord symbol displayed in the header label (e.g. "Fm9"). */
  chordName: string;
  /** Visual theme ('pastel' or 'dark'). */
  theme?: 'pastel' | 'dark';
  /** Optional container class name. */
  className?: string;
}

/**
 * Layout constants for the SVG fretboard diagram.
 */
const NUM_STRINGS = 6;
const NUM_FRETS = 5;

const STRING_START_X = 38;
const STRING_SPACING = 22;
const STRING_END_X = STRING_START_X + (NUM_STRINGS - 1) * STRING_SPACING; // 148

const NUT_Y = 32;
const FRET_SPACING = 24;
const FRETBOARD_BOTTOM_Y = NUT_Y + NUM_FRETS * FRET_SPACING; // 152

const TOP_MARKER_Y = 18;
const BOTTOM_LABEL_Y = 172;

function getStringX(index: number): number {
  return STRING_START_X + index * STRING_SPACING;
}

function getFretCenterY(relativeFret: number): number {
  return NUT_Y + (relativeFret - 0.5) * FRET_SPACING;
}

function stringNumberToIndex(stringNum: number): number {
  return 6 - Math.max(1, Math.min(6, stringNum));
}

/**
 * SVG-based Guitar Chord Diagram matching the Swan Glide video.
 *
 * Displays nut/frets, barre pill, finger dots, top markers, and bottom note names,
 * alongside the Swan Glide watermark branding.
 */
export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({
  voicing,
  chordName,
  theme = 'pastel',
  className,
}) => {
  const isDark = theme === 'dark';
  const baseFret = voicing.baseFret ?? 1;
  const isNutVisible = baseFret <= 1;
  const barres = voicing.barres ?? [];

  const mainColor = isDark ? '#FFFFFF' : '#2E104D';
  const mutedColor = isDark ? '#71717A' : 'rgba(46, 16, 77, 0.45)';
  const gridLineColor = isDark ? 'rgba(255, 255, 255, 0.22)' : 'rgba(46, 16, 77, 0.35)';

  return (
    <div
      className={clsx(
        'w-full flex items-center justify-between px-6 sm:px-8 py-2 select-none transition-colors duration-300',
        className
      )}
    >
      {/* Left Column: GUITAR label and SVG Chord Box */}
      <div className="flex flex-col items-center">
        <span
          className={clsx(
            'text-[10px] sm:text-[11px] font-bold uppercase tracking-widest mb-1 transition-colors duration-200',
            mutedColor
          )}
        >
          GUITAR
        </span>

        <svg
          viewBox="0 0 186 186"
          className="w-[155px] sm:w-[175px] h-auto overflow-visible"
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
                floodOpacity={isDark ? '0.4' : '0.25'}
              />
            </filter>
          </defs>

          {/* Fret position indicator (e.g. "3fr", "4fr") shown when baseFret > 1 */}
          {!isNutVisible && (
            <text
              x={STRING_START_X - 8}
              y={getFretCenterY(1) + 4}
              textAnchor="end"
              fill={mainColor}
              className="font-bold font-mono text-[11px] select-none"
            >
              {baseFret}fr
            </text>
          )}

          {/* Top nut or fret line */}
          <line
            x1={STRING_START_X - (isNutVisible ? 1 : 0)}
            y1={NUT_Y}
            x2={STRING_END_X + (isNutVisible ? 1 : 0)}
            y2={NUT_Y}
            stroke={mainColor}
            strokeWidth={isNutVisible ? 4.5 : 1.5}
            strokeLinecap="round"
          />

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

          {/* Vertical string lines */}
          {Array.from({ length: NUM_STRINGS }).map((_, i) => {
            const x = getStringX(i);
            const strokeWidth = 1.0 + (NUM_STRINGS - 1 - i) * 0.2;
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

            const startX = getStringX(minIdx) - 7;
            const endX = getStringX(maxIdx) + 7;
            const pillWidth = endX - startX;
            const pillHeight = 12;

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
                    strokeWidth={1.6}
                    strokeLinecap="round"
                  />
                  <line
                    x1={x + 3.5}
                    y1={TOP_MARKER_Y - 3.5}
                    x2={x - 3.5}
                    y2={TOP_MARKER_Y + 3.5}
                    stroke={mutedColor}
                    strokeWidth={1.6}
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
                  r={4}
                  fill="none"
                  stroke={mainColor}
                  strokeWidth={1.6}
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
              <circle
                key={`finger-dot-${i}`}
                cx={cx}
                cy={cy}
                r={6}
                fill={mainColor}
                filter="url(#fret-shadow)"
                className="transition-all duration-200 ease-out"
              />
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
                className="text-[10px] font-semibold font-mono select-none transition-colors duration-200"
              >
                {note}
              </text>
            );
          })}
        </svg>
      </div>

      {/* Right Column: "Made with Swan Glide by Swanek Audio" Branding */}
      <div className="flex flex-col items-start justify-center pr-2 sm:pr-4">
        <span
          className={clsx(
            'text-xs font-normal transition-colors duration-200',
            isDark ? 'text-zinc-400' : 'text-[#2E104D]/70'
          )}
        >
          Made with
        </span>
        <span
          className={clsx(
            'text-lg sm:text-xl font-bold tracking-tight transition-colors duration-200',
            isDark ? 'text-white' : 'text-[#2E104D]'
          )}
        >
          Swan Glide
        </span>
        <span
          className={clsx(
            'text-xs font-medium transition-colors duration-200',
            isDark ? 'text-zinc-400' : 'text-[#2E104D]/75'
          )}
        >
          by Swanek Audio
        </span>
        <span
          className={clsx(
            'text-[11px] font-normal transition-colors duration-200 mt-0.5',
            isDark ? 'text-zinc-500' : 'text-[#2E104D]/55'
          )}
        >
          (Link In Bio)
        </span>
      </div>
    </div>
  );
};
