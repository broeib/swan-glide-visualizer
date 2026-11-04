import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import { ProgressionTimeline } from '../types/music';
import { getThemePreset, ThemePreset } from '../engine/themes/themePresets';
import {
  DEFAULT_TRANSITION_BEATS,
  DEFAULT_VISIBLE_BEATS,
  MidiYMappingOptions,
  beatToProgress,
  beatToX,
  getPlayheadX,
  getVoiceRibbonSegments,
  getVoiceStateAtBeat,
  midiToY,
  progressToBeat,
  xToBeat,
} from '../utils/splineMath';

/**
 * Props for the VoiceLeadingCanvas component.
 */
export interface VoiceLeadingCanvasProps {
  /** Progression timeline model containing chord steps and tempo. */
  progression: ProgressionTimeline;
  /** Normalized playback progress between 0.0 and 1.0. */
  progress: number;
  /** Visual theme identifier or ThemePreset. */
  theme?: string | ThemePreset;
  /** Optional container class name. */
  className?: string;
  /** Whether interactive seeking and scrubbing are enabled (default true). */
  interactive?: boolean;
  /** Callback fired when the user seeks to a new progress position. */
  onSeek?: (progress: number) => void;
  /** Visible beat range across canvas width (default 8). */
  visibleBeats?: number;
  /** Horizontal anchor ratio for the playhead (default 0.37). */
  playheadRatio?: number;
  /** Minimum MIDI note for vertical scaling (default 32). */
  minMidi?: number;
  /** Maximum MIDI note for vertical scaling (default 84). */
  maxMidi?: number;
  /** Vertical padding in pixels (default 36). */
  paddingY?: number;
}

/**
 * Active playhead node configuration for rendering.
 */
interface ActivePlayheadNode {
  voiceIndex: number;
  y: number;
  color: string;
  label: string;
  midi: number;
}

/**
 * Voice-Leading Spline Timeline Canvas component.
 *
 * Replicates the authentic Swan Glide visualizer aesthetics:
 * - Faint horizontal semitone grid lines
 * - Vertical bar lines labeled at the top with chord names
 * - Solid, glowing saturated line trails to the left of the playhead
 * - Translucent preview paths to the right of the playhead
 * - Playhead anchored at 37% with glowing intersection nodes
 * - Note name labels floating directly to the right in matching voice colors
 */
export const VoiceLeadingCanvas: React.FC<VoiceLeadingCanvasProps> = ({
  progression,
  progress,
  theme = 'pastel',
  className,
  interactive = true,
  onSeek,
  visibleBeats = DEFAULT_VISIBLE_BEATS,
  playheadRatio = 0.37,
  minMidi = 32,
  maxMidi = 84,
  paddingY = 36,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const themePreset: ThemePreset = useMemo(() => {
    if (typeof theme === 'string') {
      return getThemePreset(theme);
    }
    return theme;
  }, [theme]);

  const isDark = themePreset.isDark;

  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({
    width: 0,
    height: 0,
  });

  const isDraggingRef = useRef<boolean>(false);
  const dragStartRef = useRef<{ pointerX: number; initialProgress: number } | null>(
    null,
  );

  const midiOptions: MidiYMappingOptions = {
    minMidi,
    maxMidi,
    paddingTop: paddingY,
    paddingBottom: paddingY,
  };

  // ResizeObserver to track container dimensions cleanly
  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const updateDimensions = () => {
      const rect = container.getBoundingClientRect();
      const width = Math.max(0, Math.floor(rect.width));
      const height = Math.max(0, Math.floor(rect.height));

      setDimensions((prev) => {
        if (prev.width === width && prev.height === height) {
          return prev;
        }
        return { width, height };
      });
    };

    updateDimensions();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const roundedWidth = Math.max(0, Math.floor(width));
        const roundedHeight = Math.max(0, Math.floor(height));

        setDimensions((prev) => {
          if (prev.width === roundedWidth && prev.height === roundedHeight) {
            return prev;
          }
          return { width: roundedWidth, height: roundedHeight };
        });
      }
    });

    observer.observe(container);

    return () => {
      observer.disconnect();
    };
  }, []);

  // Main canvas render function
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    const { width, height } = dimensions;
    if (width <= 0 || height <= 0) {
      return;
    }

    const dpr = window.devicePixelRatio || 1;

    if (
      canvas.width !== Math.round(width * dpr) ||
      canvas.height !== Math.round(height * dpr)
    ) {
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
    }

    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const totalBeats = progression.getTotalBeats();
    const currentBeat = progressToBeat(progress, totalBeats);
    const playheadX = getPlayheadX(width, playheadRatio);

    // 1. Refined musical pitch ruler & octave grid lines
    const octaveNotes = [
      { midi: 36, label: 'C2' },
      { midi: 48, label: 'C3' },
      { midi: 60, label: 'C4' },
      { midi: 72, label: 'C5' },
      { midi: 84, label: 'C6' },
    ];

    ctx.save();
    // Ultra-subtle intermediate semitone guide lines
    ctx.strokeStyle = themePreset.gridLineColor;
    ctx.lineWidth = 0.75;
    for (let midi = minMidi; midi <= maxMidi; midi++) {
      if (midi % 12 === 0) continue; // Drawn with prominent octave styling below
      const y = midiToY(midi, height, midiOptions);
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Prominent octave reference lines with left margin pitch labels
    for (const oct of octaveNotes) {
      if (oct.midi >= minMidi && oct.midi <= maxMidi) {
        const y = midiToY(oct.midi, height, midiOptions);
        ctx.strokeStyle = isDark
          ? 'rgba(255, 255, 255, 0.12)'
          : 'rgba(36, 10, 52, 0.12)';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 4]);
        ctx.beginPath();
        ctx.moveTo(26, y);
        ctx.lineTo(width, y);
        ctx.stroke();
        ctx.setLineDash([]);

        // Micro-pitch label
        ctx.font = '500 9px "JetBrains Mono", monospace';
        ctx.fillStyle = themePreset.textMutedColor;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(oct.label, 6, y);
      }
    }
    ctx.restore();

    // 2. Chord step boundary vertical bar lines and chord name headers
    if (totalBeats > 0 && progression.steps.length > 0) {
      const beatStart = xToBeat(0, currentBeat, width, visibleBeats, playheadRatio);
      const beatEnd = xToBeat(width, currentBeat, width, visibleBeats, playheadRatio);
      const minCycle = Math.floor((beatStart - 4) / totalBeats);
      const maxCycle = Math.floor((beatEnd + 4) / totalBeats);

      const barLineColor = themePreset.barLineColor;
      const chordLabelColor = isDark
        ? 'rgba(255, 255, 255, 0.85)'
        : themePreset.textColor;

      for (let cycle = minCycle; cycle <= maxCycle; cycle++) {
        let stepStartAccumulator = cycle * totalBeats;

        for (let i = 0; i < progression.steps.length; i++) {
          const step = progression.steps[i];
          if (!step) {
            continue;
          }
          const stepStartBeat = stepStartAccumulator;
          stepStartAccumulator += step.durationBeats;

          const stepX = beatToX(
            stepStartBeat,
            currentBeat,
            width,
            visibleBeats,
            playheadRatio,
          );

          if (stepX >= -80 && stepX <= width + 80) {
            // Clean vertical bar line
            ctx.save();
            ctx.strokeStyle = barLineColor;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(stepX, 28);
            ctx.lineTo(stepX, height - 12);
            ctx.stroke();

            // Draw upcoming chord step label if not directly under the hero chord header
            if (stepX > playheadX + 25 || stepX < playheadX - 60) {
              ctx.font = '700 10px "Outfit", "Plus Jakarta Sans", sans-serif';
              const chordText = step.chordName;
              const textWidth = ctx.measureText(chordText).width;

              ctx.fillStyle = isDark
                ? 'rgba(12, 9, 20, 0.80)'
                : 'rgba(255, 255, 255, 0.88)';
              ctx.beginPath();
              if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(stepX + 4, 10, textWidth + 8, 15, 4);
              } else {
                ctx.rect(stepX + 4, 10, textWidth + 8, 15);
              }
              ctx.fill();

              ctx.fillStyle = chordLabelColor;
              ctx.textAlign = 'left';
              ctx.textBaseline = 'middle';
              ctx.fillText(chordText, stepX + 8, 17.5);
            }
            ctx.restore();
          }
        }
      }
    }

    // 3. Render continuous ribbons for each voice
    const maxVoices = Math.max(
      ...progression.steps.map((s) => s.voices.length),
      6,
    );

    const palette = themePreset.voicePalette;

    for (let v = 0; v < maxVoices; v++) {
      const segments = getVoiceRibbonSegments(
        progression,
        v,
        currentBeat,
        width,
        height,
        visibleBeats,
        playheadRatio,
        midiOptions,
        DEFAULT_TRANSITION_BEATS,
      );

      if (segments.length === 0) {
        continue;
      }

      const voiceColor =
        palette[v % palette.length] ??
        progression.steps[0]?.voices[v]?.color ??
        '#A855F7';

      // Pass 1: Render future preview (right of playhead) in softer translucent stroke
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 2.4;
      ctx.strokeStyle = voiceColor;
      ctx.globalAlpha = isDark ? 0.40 : 0.35;

      ctx.beginPath();
      let firstFuture = true;
      for (const seg of segments) {
        if (seg.xEnd > playheadX) {
          if (firstFuture) {
            ctx.moveTo(Math.max(playheadX, seg.xStart), seg.yStart);
            firstFuture = false;
          } else {
            ctx.lineTo(seg.xStart, seg.yStart);
          }
          ctx.lineTo(seg.xTransition, seg.yStart);
          ctx.bezierCurveTo(
            seg.cp1.x,
            seg.cp1.y,
            seg.cp2.x,
            seg.cp2.y,
            seg.xEnd,
            seg.yEnd,
          );
        }
      }
      ctx.stroke();
      ctx.restore();

      // Pass 2: Render active trail (left of playhead) with vibrant glow
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3.8;
      ctx.strokeStyle = voiceColor;
      ctx.shadowColor = voiceColor;
      ctx.shadowBlur = isDark ? 16 : 8;

      ctx.beginPath();
      let firstPast = true;
      for (const seg of segments) {
        if (seg.xStart <= playheadX) {
          const clampedEnd = Math.min(playheadX, seg.xEnd);
          if (firstPast) {
            ctx.moveTo(seg.xStart, seg.yStart);
            firstPast = false;
          } else {
            ctx.lineTo(seg.xStart, seg.yStart);
          }

          if (seg.xTransition >= playheadX) {
            ctx.lineTo(clampedEnd, seg.yStart);
          } else {
            ctx.lineTo(seg.xTransition, seg.yStart);
            ctx.bezierCurveTo(
              seg.cp1.x,
              seg.cp1.y,
              seg.cp2.x,
              seg.cp2.y,
              clampedEnd,
              seg.yEnd,
            );
          }
        }
      }
      ctx.stroke();
      ctx.restore();

      // Pass 3: White specular center glint for high-end glass tube sheen
      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 1.0;
      ctx.strokeStyle = '#FFFFFF';
      ctx.globalAlpha = isDark ? 0.40 : 0.60;

      ctx.beginPath();
      let firstGlint = true;
      for (const seg of segments) {
        if (seg.xStart <= playheadX) {
          const clampedEnd = Math.min(playheadX, seg.xEnd);
          if (firstGlint) {
            ctx.moveTo(seg.xStart, seg.yStart);
            firstGlint = false;
          } else {
            ctx.lineTo(seg.xStart, seg.yStart);
          }

          if (seg.xTransition >= playheadX) {
            ctx.lineTo(clampedEnd, seg.yStart);
          } else {
            ctx.lineTo(seg.xTransition, seg.yStart);
            ctx.bezierCurveTo(
              seg.cp1.x,
              seg.cp1.y,
              seg.cp2.x,
              seg.cp2.y,
              clampedEnd,
              seg.yEnd,
            );
          }
        }
      }
      ctx.stroke();
      ctx.restore();
    }

    // 4. Render vertical playhead line
    ctx.save();
    ctx.strokeStyle = themePreset.playheadColor;
    ctx.shadowColor = themePreset.playheadGlowColor;
    ctx.shadowBlur = themePreset.playheadGlowBlur;
    ctx.lineWidth = 1.75;
    ctx.beginPath();
    ctx.moveTo(playheadX, 10);
    ctx.lineTo(playheadX, height - 10);
    ctx.stroke();
    ctx.restore();

    // 5. Calculate active nodes at the playhead
    const activeNodes: ActivePlayheadNode[] = [];
    for (let v = 0; v < maxVoices; v++) {
      const voiceState = getVoiceStateAtBeat(
        progression,
        v,
        currentBeat,
        DEFAULT_TRANSITION_BEATS,
      );
      const nodeY = midiToY(voiceState.midi, height, midiOptions);
      const nodeColor = palette[v % palette.length] ?? voiceState.color;

      activeNodes.push({
        voiceIndex: v,
        y: nodeY,
        color: nodeColor,
        label: voiceState.label,
        midi: voiceState.midi,
      });
    }

    // 6. Draw glowing playhead intersection nodes
    for (const node of activeNodes) {
      ctx.save();
      // Outer halo glow
      ctx.shadowColor = node.color;
      ctx.shadowBlur = isDark ? 20 : 12;
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(playheadX, node.y, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Soft semi-transparent outer ring
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.arc(playheadX, node.y, 9.5, 0, Math.PI * 2);
      ctx.fill();

      // Sharp white center dot
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(playheadX, node.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 7. Render note labels directly to the right inside floating pill badges
    for (const node of activeNodes) {
      const formattedLabel = node.label.replace('b', '♭').replace('#', '♯');
      ctx.save();
      ctx.font = '700 11px "Plus Jakarta Sans", system-ui, sans-serif';
      const textWidth = ctx.measureText(formattedLabel).width;
      const pillW = Math.max(textWidth + 12, 34);
      const pillH = 17;
      const pillX = playheadX + 11;
      const pillY = node.y - pillH / 2;
      const radius = pillH / 2;

      // Pill capsule background with soft drop shadow
      ctx.save();
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') {
        ctx.roundRect(pillX, pillY, pillW, pillH, radius);
      } else {
        ctx.rect(pillX, pillY, pillW, pillH);
      }
      ctx.fillStyle = isDark
        ? 'rgba(15, 12, 24, 0.88)'
        : 'rgba(255, 255, 255, 0.92)';
      ctx.shadowColor = isDark
        ? 'rgba(0, 0, 0, 0.6)'
        : 'rgba(36, 10, 52, 0.18)';
      ctx.shadowBlur = 6;
      ctx.shadowOffsetY = 1;
      ctx.fill();

      // Pill outline in voice color
      ctx.strokeStyle = node.color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.restore();

      // Note label text centered inside pill
      ctx.fillStyle = isDark ? '#FFFFFF' : node.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(formattedLabel, pillX + pillW / 2, node.y + 0.5);
      ctx.restore();
    }

    ctx.restore();
  }, [
    dimensions,
    isDark,
    maxMidi,
    minMidi,
    midiOptions,
    paddingY,
    playheadRatio,
    progress,
    progression,
    themePreset,
    visibleBeats,
  ]);

  // Request animation frame scheduling for rendering
  useEffect(() => {
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
    }
    rafIdRef.current = requestAnimationFrame(() => {
      renderFrame();
    });

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [renderFrame]);

  // Direct pointer seek calculation
  const seekToClientX = useCallback(
    (clientX: number) => {
      if (!onSeek) {
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const totalBeats = progression.getTotalBeats();
      const currentBeat = progressToBeat(progress, totalBeats);
      const targetBeat = xToBeat(
        x,
        currentBeat,
        rect.width,
        visibleBeats,
        playheadRatio,
      );
      const newProgress = beatToProgress(targetBeat, totalBeats);

      onSeek(newProgress);
    },
    [onSeek, playheadRatio, progress, progression, visibleBeats],
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive || !onSeek) {
      return;
    }
    e.currentTarget.setPointerCapture(e.pointerId);
    isDraggingRef.current = true;
    dragStartRef.current = {
      pointerX: e.clientX,
      initialProgress: progress,
    };
    seekToClientX(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!interactive || !onSeek || !isDraggingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const dragStart = dragStartRef.current;
    if (!canvas || !dragStart) {
      seekToClientX(e.clientX);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    const deltaX = e.clientX - dragStart.pointerX;
    const pixelsPerBeat = rect.width / (visibleBeats || DEFAULT_VISIBLE_BEATS);
    const deltaBeat = -deltaX / pixelsPerBeat;

    const totalBeats = progression.getTotalBeats();
    const startBeat = progressToBeat(dragStart.initialProgress, totalBeats);
    const newProgress = beatToProgress(startBeat + deltaBeat, totalBeats);

    onSeek(newProgress);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      dragStartRef.current = null;
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Pointer capture was already released
      }
    }
  };

  return (
    <div
      ref={containerRef}
      className={clsx(
        'relative w-full h-full min-h-[340px] overflow-hidden select-none',
        interactive && onSeek && 'cursor-ew-resize',
        className,
      )}
    >
      <canvas
        ref={canvasRef}
        className="block w-full h-full"
        style={{ touchAction: interactive && onSeek ? 'none' : 'auto' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
};
