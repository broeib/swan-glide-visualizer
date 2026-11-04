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
  /** Optional container class name. */
  className?: string;
}

/**
 * Geometric layout constants for the SVG fretboard diagram.
 */
const NUM_STRINGS = 6;
const NUM_FRETS = 5;

// Coordinate layout within viewBox (200 x 225)
const STRING_START_X = 42;
const STRING_SPACING = 24;
const STRING_END_X = STRING_START_X + (NUM_STRINGS - 1) * STRING_SPACING; // 162

const NUT_Y = 38;
const FRET_SPACING = 28;
const FRETBOARD_BOTTOM_Y = NUT_Y + NUM_FRETS * FRET_SPACING; // 178

const TOP_MARKER_Y = 20;
const BOTTOM_LABEL_Y = 198;

/**
 * Maps a string index (0 to 5, where 0 is string 6 / low E, and 5 is string 1 / high E)
 * to its horizontal SVG x-coordinate.
 */
function getStringX(index: number): number {
  return STRING_START_X + index * STRING_SPACING;
}

/**
 * Maps a 1-based relative fret number (1 to 5) to its vertical SVG center y-coordinate.
 */
function getFretCenterY(relativeFret: number): number {
  return NUT_Y + (relativeFret - 0.5) * FRET_SPACING;
}

/**
 * Calculates string index (0 to 5) from standard 1-based guitar string number
 * (where string 1 is high E and string 6 is low E).
 */
function stringNumberToIndex(stringNum: number): number {
  return 6 - Math.max(1, Math.min(6, stringNum));
}

/**
 * SVG-based 6-String Guitar Fretboard Diagram.
 *
 * Renders a crisp chord box with:
 * - 6 vertical string lines (low E on left to high E on right)
 * - 5 horizontal fret lines
 * - Dynamic nut line (thick if baseFret <= 1, standard fret line with "Xfr" indicator if baseFret > 1)
 * - Rounded barre pills spanning barred strings
 * - Glowing finger dots on active frets
 * - Top mute ('x') and open ('o') markers above the nut
 * - Note name labels beneath each string
 * - Smooth CSS transitions across chord voicing changes
 */
export const GuitarFretboard: React.FC<GuitarFretboardProps> = ({
  voicing,
  chordName,
  className,
}) => {
  const baseFret = voicing.baseFret ?? 1;
  const isNutVisible = baseFret <= 1;

  // Process barres with relative fret translation
  const barres = voicing.barres ?? [];

  return (
    <div
      className={clsx(
        'flex flex-col items-center justify-center p-4 rounded-2xl bg-white/60 backdrop-blur-md border border-white/70 shadow-sm transition-all duration-300',
        className
      )}
    >
      {/* Optional title badge displaying the chord name */}
      <div className="w-full flex items-center justify-between mb-1 px-1">
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#2D1B4E]/60">
          Voicing
        </span>
        <span className="text-xs font-bold font-mono text-[#2D1B4E] px-2 py-0.5 rounded-md bg-violet-100/60">
          {chordName}
        </span>
      </div>

      <svg
        viewBox="0 0 200 216"
        className="w-full max-w-[210px] h-auto select-none overflow-visible"
        aria-label={`Guitar chord diagram for ${chordName}`}
        role="img"
      >
        <defs>
          {/* Subtle drop shadow filter for finger dots and barre pill */}
          <filter id="fret-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow
              dx="0"
              dy="1.5"
              stdDeviation="1.5"
              floodColor="#2D1B4E"
              floodOpacity="0.3"
            />
          </filter>
        </defs>

        {/* Fret position indicator (e.g. "8fr" or "4fr") shown when baseFret > 1 */}
        {!isNutVisible && (
          <text
            x={STRING_START_X - 10}
            y={getFretCenterY(1) + 4}
            textAnchor="end"
            className="fill-[#2D1B4E] font-bold font-mono text-xs select-none transition-all duration-300"
          >
            {baseFret}fr
          </text>
        )}

        {/* Top nut or top fret wire */}
        {isNutVisible ? (
          <line
            x1={STRING_START_X - 1}
            y1={NUT_Y}
            x2={STRING_END_X + 1}
            y2={NUT_Y}
            stroke="#2D1B4E"
            strokeWidth={4.5}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        ) : (
          <line
            x1={STRING_START_X}
            y1={NUT_Y}
            x2={STRING_END_X}
            y2={NUT_Y}
            stroke="#94A3B8"
            strokeWidth={1.5}
            strokeLinecap="round"
            className="transition-all duration-300"
          />
        )}

        {/* Horizontal fret lines (frets 1 to 5) */}
        {Array.from({ length: NUM_FRETS }).map((_, i) => {
          const fretWireY = NUT_Y + (i + 1) * FRET_SPACING;
          return (
            <line
              key={`fret-wire-${i + 1}`}
              x1={STRING_START_X}
              y1={fretWireY}
              x2={STRING_END_X}
              y2={fretWireY}
              stroke="#CBD5E1"
              strokeWidth={1.5}
            />
          );
        })}

        {/* Vertical string lines (strings 6 to 1) with subtle string gauge variation */}
        {Array.from({ length: NUM_STRINGS }).map((_, i) => {
          const x = getStringX(i);
          // Gauge ranges from ~2.2px for low E down to ~1.0px for high E
          const strokeWidth = 1.0 + (NUM_STRINGS - 1 - i) * 0.24;
          return (
            <line
              key={`string-line-${i}`}
              x1={x}
              y1={NUT_Y}
              x2={x}
              y2={FRETBOARD_BOTTOM_Y}
              stroke="#94A3B8"
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          );
        })}

        {/* Barre indicators: smooth rounded pills across barred strings */}
        {barres.map((barre: Barre, barreIdx: number) => {
          const fromIdx = stringNumberToIndex(barre.fromString);
          const toIdx = stringNumberToIndex(barre.toString);
          const minIdx = Math.min(fromIdx, toIdx);
          const maxIdx = Math.max(fromIdx, toIdx);

          const startX = getStringX(minIdx) - 8;
          const endX = getStringX(maxIdx) + 8;
          const pillWidth = endX - startX;
          const pillHeight = 14;

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
              fill="#2D1B4E"
              filter="url(#fret-glow)"
              className="transition-all duration-300 ease-out"
            />
          );
        })}

        {/* Top markers (above the nut): 'x' for muted strings, 'o' for open strings */}
        {voicing.frets.map((fret, i) => {
          const x = getStringX(i);
          if (fret === 'x') {
            return (
              <g
                key={`top-marker-${i}`}
                className="transition-opacity duration-200"
              >
                <line
                  x1={x - 4}
                  y1={TOP_MARKER_Y - 4}
                  x2={x + 4}
                  y2={TOP_MARKER_Y + 4}
                  stroke="#94A3B8"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                />
                <line
                  x1={x + 4}
                  y1={TOP_MARKER_Y - 4}
                  x2={x - 4}
                  y2={TOP_MARKER_Y + 4}
                  stroke="#94A3B8"
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
                r={4.5}
                fill="none"
                stroke="#2D1B4E"
                strokeWidth={1.8}
                className="transition-all duration-200"
              />
            );
          }

          return null;
        })}

        {/* Finger dots: active fret positions */}
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
            <g
              key={`finger-dot-${i}`}
              className="transition-transform duration-300 ease-out"
            >
              {/* Outer dot with drop shadow */}
              <circle
                cx={cx}
                cy={cy}
                r={6.5}
                fill="#2D1B4E"
                filter="url(#fret-glow)"
                className="transition-all duration-300 ease-out"
              />
              {/* Subtle inner highlight for depth */}
              <circle
                cx={cx - 1.2}
                cy={cy - 1.2}
                r={2}
                fill="rgba(255, 255, 255, 0.35)"
                className="pointer-events-none"
              />
            </g>
          );
        })}

        {/* String note labels directly beneath each string */}
        {voicing.stringNotes.map((note, i) => {
          const x = getStringX(i);
          const isMuted = note === 'x' || voicing.frets[i] === 'x';
          return (
            <text
              key={`string-note-${i}`}
              x={x}
              y={BOTTOM_LABEL_Y}
              textAnchor="middle"
              className={clsx(
                'text-[11px] font-bold font-mono select-none transition-colors duration-200',
                isMuted ? 'fill-slate-400' : 'fill-[#2D1B4E]'
              )}
            >
              {note}
            </text>
          );
        })}
      </svg>
    </div>
  );
};
