import React, { useMemo } from 'react';
import clsx from 'clsx';
import { ChordStep, VoiceNote } from '../types/music';
import { getThemePreset, ThemePreset } from '../engine/themes/themePresets';

/**
 * Props for the KeyboardDiagram component.
 */
export interface KeyboardDiagramProps {
  /** Active chord step containing voices and chord name. */
  step: ChordStep;
  /** Visual theme identifier ('pastel', 'dark', 'sunset', 'lofi', 'cream') or ThemePreset. */
  theme?: string | ThemePreset;
  /** Optional container class name. */
  className?: string;
  /** Optional minimum MIDI note for key range (default: 36 / C2). */
  startMidi?: number;
  /** Optional maximum MIDI note for key range (default: 81 / A5). */
  endMidi?: number;
}

/**
 * MIDI pitch class structure for piano key geometry.
 */
interface PianoKey {
  midi: number;
  pitchClass: number; // 0 = C, 1 = C#, ..., 11 = B
  octave: number;
  isBlack: boolean;
  whiteIndex: number;
  noteName: string;
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'] as const;

/**
 * Formats accidental note names with authentic musical glyphs (sharp and flat).
 */
function formatKeyGlyph(noteName: string): string {
  return noteName.replace('#', '♯').replace('b', '♭');
}

/**
 * Modern illuminated top-down piano keyboard SVG component.
 *
 * Visualizes 2.5 to 3 octaves of piano keys with active voice notes
 * illuminated in their designated layer colors, subtle halo glow filters,
 * and clear pitch badges.
 */
export const KeyboardDiagram: React.FC<KeyboardDiagramProps> = ({
  step,
  theme = 'pastel',
  className,
  startMidi: propStartMidi,
  endMidi: propEndMidi,
}) => {
  const themePreset: ThemePreset = useMemo(() => {
    if (typeof theme === 'string') {
      return getThemePreset(theme);
    }
    return theme;
  }, [theme]);

  // Dynamically compute key range to ensure all active voices fit comfortably
  const { startMidi, endMidi } = useMemo(() => {
    let minMidi = propStartMidi ?? 36; // C2
    let maxMidi = propEndMidi ?? 81;   // A5

    if (step.voices.length > 0) {
      const voiceMidis = step.voices.map((v) => v.midi);
      const lowestVoice = Math.min(...voiceMidis);
      const highestVoice = Math.max(...voiceMidis);

      if (lowestVoice < minMidi) {
        // Snap down to previous C
        minMidi = Math.floor(lowestVoice / 12) * 12;
      }
      if (highestVoice > maxMidi) {
        // Snap up to next B or C
        maxMidi = Math.ceil((highestVoice + 1) / 12) * 12 - 1;
      }
    }

    return { startMidi: minMidi, endMidi: maxMidi };
  }, [propStartMidi, propEndMidi, step.voices]);

  // Build key array from startMidi to endMidi
  const { whiteKeys, blackKeys, totalWhiteKeys } = useMemo(() => {
    const whites: PianoKey[] = [];
    const blacks: PianoKey[] = [];
    let currentWhiteIndex = 0;

    for (let midi = startMidi; midi <= endMidi; midi++) {
      const pitchClass = midi % 12;
      const octave = Math.floor(midi / 12) - 1;
      const isBlack = [1, 3, 6, 8, 10].includes(pitchClass);
      const noteName = `${NOTE_NAMES[pitchClass]}${octave}`;

      if (!isBlack) {
        whites.push({
          midi,
          pitchClass,
          octave,
          isBlack: false,
          whiteIndex: currentWhiteIndex,
          noteName,
        });
        currentWhiteIndex++;
      } else {
        // Reference to preceding white key index
        blacks.push({
          midi,
          pitchClass,
          octave,
          isBlack: true,
          whiteIndex: currentWhiteIndex - 1,
          noteName,
        });
      }
    }

    return {
      whiteKeys: whites,
      blackKeys: blacks,
      totalWhiteKeys: currentWhiteIndex,
    };
  }, [startMidi, endMidi]);

  // Voice lookup map by MIDI note number
  const voiceByMidi = useMemo(() => {
    const map = new Map<number, VoiceNote>();
    for (const voice of step.voices) {
      map.set(voice.midi, voice);
    }
    return map;
  }, [step.voices]);

  // SVG Geometry constants
  const whiteKeyWidth = 13.5;
  const whiteKeyHeight = 62;
  const blackKeyWidth = 8.2;
  const blackKeyHeight = 38;
  const paddingX = 4;
  const paddingY = 4;

  const totalWidth = paddingX * 2 + totalWhiteKeys * whiteKeyWidth;
  const totalHeight = paddingY * 2 + whiteKeyHeight;

  // Stagger offsets for black keys within an octave
  const getBlackKeyOffset = (pitchClass: number): number => {
    switch (pitchClass) {
      case 1:  // C#
        return -1.2;
      case 3:  // D#
        return 1.2;
      case 6:  // F#
        return -1.6;
      case 8:  // G#
        return 0;
      case 10: // A#
        return 1.6;
      default:
        return 0;
    }
  };

  const isDark = themePreset.isDark;
  const mainTextColor = themePreset.textColor;
  const mutedTextColor = themePreset.textMutedColor;

  return (
    <div
      className={clsx(
        'w-full flex flex-col justify-center px-4 sm:px-6 py-2 select-none transition-colors duration-300',
        className,
      )}
    >
      {/* Top Header: KEYBOARD label, chord badge, and Swan Glide branding */}
      <div className="w-full flex items-center justify-between mb-1.5 px-1">
        <div className="flex items-center gap-2">
          <span
            className="text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors duration-200"
            style={{ color: mutedTextColor }}
          >
            KEYBOARD
          </span>
          <span
            className={clsx(
              'px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide transition-all shadow-sm',
              isDark
                ? 'bg-white/10 text-white border border-white/15'
                : 'bg-purple-900/10 text-[#2E104D] border border-purple-900/15',
            )}
          >
            {step.chordName}
          </span>
        </div>

        <div className="flex flex-col items-end">
          <span
            className="text-[9px] sm:text-[10px] font-semibold tracking-tight transition-colors duration-200"
            style={{ color: mutedTextColor }}
          >
            Swan Glide by Swanek Audio
          </span>
        </div>
      </div>

      {/* Piano Keyboard SVG Container */}
      <div className="w-full flex justify-center overflow-x-auto overflow-y-hidden py-1">
        <svg
          viewBox={`0 0 ${totalWidth} ${totalHeight}`}
          className="w-full max-w-[390px] h-auto overflow-visible drop-shadow-sm"
          role="img"
          aria-label={`Illuminated piano keyboard diagram for ${step.chordName}`}
        >
          <defs>
            {/* Glow filters for active illuminated keys */}
            <filter id="key-glow-soft" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="black-key-shadow" x="-30%" y="-20%" width="160%" height="150%">
              <feDropShadow dx="0" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.45" />
            </filter>
          </defs>

          {/* Layer 1: Natural (White) Keys */}
          {whiteKeys.map((key) => {
            const x = paddingX + key.whiteIndex * whiteKeyWidth;
            const y = paddingY;
            const activeVoice = voiceByMidi.get(key.midi);
            const isPlaying = activeVoice !== undefined;

            return (
              <g key={`white-${key.midi}`}>
                {/* Key Rectangle */}
                <rect
                  x={x}
                  y={y}
                  width={whiteKeyWidth - 1}
                  height={whiteKeyHeight}
                  rx={2.5}
                  ry={2.5}
                  fill={
                    isPlaying
                      ? activeVoice.color
                      : themePreset.keyboardWhiteKeyFill
                  }
                  stroke={
                    isPlaying
                      ? activeVoice.color
                      : themePreset.keyboardWhiteKeyStroke
                  }
                  strokeWidth={isPlaying ? 1.5 : 1}
                  fillOpacity={isPlaying ? 0.95 : 1}
                  className="transition-colors duration-150"
                  filter={isPlaying ? 'url(#key-glow-soft)' : undefined}
                />

                {/* Subtle top gloss on white keys */}
                {!isPlaying && (
                  <rect
                    x={x + 1}
                    y={y + 1}
                    width={whiteKeyWidth - 3}
                    height={whiteKeyHeight * 0.4}
                    rx={1.5}
                    ry={1.5}
                    fill="#FFFFFF"
                    fillOpacity={isDark ? 0.05 : 0.4}
                    pointerEvents="none"
                  />
                )}

                {/* Note Badge on Active White Key */}
                {isPlaying && (
                  <g>
                    {/* Badge circle at base of key */}
                    <circle
                      cx={x + (whiteKeyWidth - 1) / 2}
                      cy={y + whiteKeyHeight - 9}
                      r={4.8}
                      fill="#FFFFFF"
                      stroke={activeVoice.color}
                      strokeWidth={1.2}
                    />
                    {/* Note name letter */}
                    <text
                      x={x + (whiteKeyWidth - 1) / 2}
                      y={y + whiteKeyHeight - 6.8}
                      textAnchor="middle"
                      fill={activeVoice.color}
                      fontSize="5.8"
                      fontWeight="800"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {formatKeyGlyph(activeVoice.label.replace(/[0-9]/g, ''))}
                    </text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Layer 2: Sharp and Flat (Black) Keys */}
          {blackKeys.map((key) => {
            const seamX = paddingX + (key.whiteIndex + 1) * whiteKeyWidth;
            const offset = getBlackKeyOffset(key.pitchClass);
            const x = seamX - blackKeyWidth / 2 + offset;
            const y = paddingY;
            const activeVoice = voiceByMidi.get(key.midi);
            const isPlaying = activeVoice !== undefined;

            return (
              <g key={`black-${key.midi}`}>
                {/* Black Key Body with 3D drop shadow */}
                <rect
                  x={x}
                  y={y}
                  width={blackKeyWidth}
                  height={blackKeyHeight}
                  rx={1.8}
                  ry={1.8}
                  fill={
                    isPlaying
                      ? activeVoice.color
                      : themePreset.keyboardBlackKeyFill
                  }
                  stroke={
                    isPlaying
                      ? '#FFFFFF'
                      : themePreset.keyboardBlackKeyStroke
                  }
                  strokeWidth={isPlaying ? 1.2 : 0.8}
                  filter={isPlaying ? 'url(#key-glow-soft)' : 'url(#black-key-shadow)'}
                  className="transition-colors duration-150"
                />

                {/* Black key top cap bevel */}
                {!isPlaying && (
                  <rect
                    x={x + 1}
                    y={y + 1}
                    width={blackKeyWidth - 2}
                    height={blackKeyHeight - 4}
                    rx={1}
                    ry={1}
                    fill="#FFFFFF"
                    fillOpacity={isDark ? 0.08 : 0.12}
                    pointerEvents="none"
                  />
                )}

                {/* Note Badge on Active Black Key */}
                {isPlaying && (
                  <g>
                    <circle
                      cx={x + blackKeyWidth / 2}
                      cy={y + blackKeyHeight - 7}
                      r={4.2}
                      fill="#FFFFFF"
                      stroke={activeVoice.color}
                      strokeWidth={1}
                    />
                    <text
                      x={x + blackKeyWidth / 2}
                      y={y + blackKeyHeight - 5}
                      textAnchor="middle"
                      fill={activeVoice.color}
                      fontSize="5"
                      fontWeight="800"
                      fontFamily="system-ui, -apple-system, sans-serif"
                    >
                      {formatKeyGlyph(activeVoice.label.replace(/[0-9]/g, ''))}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Voice Note Legend Pills */}
      <div className="w-full flex items-center justify-center flex-wrap gap-1 mt-1">
        {step.voices.map((voice, idx) => (
          <div
            key={`voice-pill-${voice.midi}-${idx}`}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-tight shadow-sm transition-all"
            style={{
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.65)',
              border: `1px solid ${voice.color}66`,
              color: isDark ? '#FFFFFF' : mainTextColor,
            }}
          >
            <span
              className="w-1.5 h-1.5 rounded-full shadow-sm"
              style={{ backgroundColor: voice.color }}
            />
            <span>{formatKeyGlyph(voice.label)}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
