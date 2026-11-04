import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import clsx from 'clsx';
import { ProgressionTimeline, VOICE_PALETTE } from '../types/music';
import {
  DEFAULT_MAX_MIDI,
  DEFAULT_MIN_MIDI,
  DEFAULT_PADDING_Y,
  DEFAULT_PLAYHEAD_RATIO,
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
  /** Optional container class name. */
  className?: string;
  /** Whether interactive seeking and scrubbing are enabled (default true). */
  interactive?: boolean;
  /** Callback fired when the user seeks to a new progress position. */
  onSeek?: (progress: number) => void;
  /** Visible beat range across canvas width (default 8). */
  visibleBeats?: number;
  /** Horizontal anchor ratio for the playhead (default 0.35). */
  playheadRatio?: number;
  /** Minimum MIDI note for vertical scaling (default 30). */
  minMidi?: number;
  /** Maximum MIDI note for vertical scaling (default 85). */
  maxMidi?: number;
  /** Vertical padding in pixels (default 40). */
  paddingY?: number;
}

/**
 * Active playhead node configuration for rendering and collision resolution.
 */
interface ActivePlayheadNode {
  voiceIndex: number;
  y: number;
  color: string;
  label: string;
  midi: number;
}

/**
 * Safe rounded rectangle path generator compatible with all canvas contexts.
 */
function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, r);
  } else {
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}

/**
 * Voice-Leading Spline Timeline Canvas component.
 *
 * Renders smooth scrolling continuous ribbons for all 5 voices,
 * high-DPI scaling, fixed playhead at 35% width, glowing intersection nodes,
 * and high-contrast pitch badges with vertical collision avoidance.
 */
export const VoiceLeadingCanvas: React.FC<VoiceLeadingCanvasProps> = ({
  progression,
  progress,
  className,
  interactive = true,
  onSeek,
  visibleBeats = DEFAULT_VISIBLE_BEATS,
  playheadRatio = DEFAULT_PLAYHEAD_RATIO,
  minMidi = DEFAULT_MIN_MIDI,
  maxMidi = DEFAULT_MAX_MIDI,
  paddingY = DEFAULT_PADDING_Y,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafIdRef = useRef<number | null>(null);

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

    // Ensure backing store matches device pixels
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

    // 1. Subtle horizontal octave pitch reference lines
    const octaveGuides = [
      { midi: 36, label: 'C2' },
      { midi: 48, label: 'C3' },
      { midi: 60, label: 'C4' },
      { midi: 72, label: 'C5' },
      { midi: 84, label: 'C6' },
    ];

    for (const guide of octaveGuides) {
      if (guide.midi < minMidi || guide.midi > maxMidi) {
        continue;
      }
      const guideY = midiToY(guide.midi, height, midiOptions);

      ctx.save();
      ctx.strokeStyle = 'rgba(45, 27, 78, 0.06)';
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 5]);
      ctx.beginPath();
      ctx.moveTo(32, guideY);
      ctx.lineTo(width, guideY);
      ctx.stroke();

      ctx.setLineDash([]);
      ctx.font = '10px Inter, system-ui, -apple-system, sans-serif';
      ctx.fillStyle = 'rgba(45, 27, 78, 0.28)';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(guide.label, 8, guideY);
      ctx.restore();
    }

    // 2. Chord step boundary dividers and chord name headers
    if (totalBeats > 0 && progression.steps.length > 0) {
      const beatStart = xToBeat(0, currentBeat, width, visibleBeats, playheadRatio);
      const beatEnd = xToBeat(width, currentBeat, width, visibleBeats, playheadRatio);
      const minCycle = Math.floor((beatStart - 4) / totalBeats);
      const maxCycle = Math.floor((beatEnd + 4) / totalBeats);

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
            // Subtle dashed vertical boundary
            ctx.save();
            ctx.strokeStyle = 'rgba(45, 27, 78, 0.08)';
            ctx.lineWidth = 1;
            ctx.setLineDash([4, 6]);
            ctx.beginPath();
            ctx.moveTo(stepX, 26);
            ctx.lineTo(stepX, height - 16);
            ctx.stroke();

            // Chord name label header
            ctx.setLineDash([]);
            ctx.font = '600 11px Inter, system-ui, -apple-system, sans-serif';
            ctx.fillStyle = 'rgba(45, 27, 78, 0.38)';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'top';
            ctx.fillText(step.chordName, stepX + 6, 8);
            ctx.restore();
          }
        }
      }
    }

    // 3. Render continuous ribbons for each of the 5 voices
    for (let v = 0; v < 5; v++) {
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
        progression.steps[0]?.voices[v]?.color ??
        VOICE_PALETTE[v] ??
        '#4F46E5';

      ctx.save();
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.lineWidth = 3.5;
      ctx.strokeStyle = voiceColor;
      ctx.shadowColor = voiceColor;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      let isFirst = true;

      for (const seg of segments) {
        if (isFirst) {
          ctx.moveTo(seg.xStart, seg.yStart);
          isFirst = false;
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

      ctx.stroke();
      ctx.restore();
    }

    // 4. Render vertical playhead line
    ctx.save();
    ctx.strokeStyle = 'rgba(45, 27, 78, 0.32)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    ctx.shadowColor = 'rgba(79, 70, 229, 0.22)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(playheadX, 0);
    ctx.lineTo(playheadX, height);
    ctx.stroke();
    ctx.restore();

    // 5. Calculate active nodes at the playhead
    const activeNodes: ActivePlayheadNode[] = [];
    for (let v = 0; v < 5; v++) {
      const voiceState = getVoiceStateAtBeat(
        progression,
        v,
        currentBeat,
        DEFAULT_TRANSITION_BEATS,
      );
      const nodeY = midiToY(voiceState.midi, height, midiOptions);
      activeNodes.push({
        voiceIndex: v,
        y: nodeY,
        color: voiceState.color,
        label: voiceState.label,
        midi: voiceState.midi,
      });
    }

    // 6. Draw glowing playhead intersection nodes
    for (const node of activeNodes) {
      ctx.save();
      // Outer halo radial glow
      ctx.shadowColor = node.color;
      ctx.shadowBlur = 12;
      ctx.fillStyle = node.color;
      ctx.beginPath();
      ctx.arc(playheadX, node.y, 6.5, 0, Math.PI * 2);
      ctx.fill();

      // Soft semi-transparent outer ring
      ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
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

    // 7. Render high-contrast pitch badges with vertical collision avoidance
    // Sort nodes vertically from top to bottom
    const sortedNodes = [...activeNodes].sort((a, b) => a.y - b.y);
    const rightSideYHistory: number[] = [];

    for (const node of sortedNodes) {
      ctx.save();
      ctx.font = '600 11px Inter, system-ui, -apple-system, sans-serif';

      const metrics = ctx.measureText(node.label);
      const textWidth = metrics.width;
      const pillHeight = 18;
      const pillWidth = Math.max(26, textWidth + 12);
      const pillY = node.y - pillHeight / 2;

      // Check vertical collision with previously placed right-side badges
      const collidesOnRight = rightSideYHistory.some(
        (prevY) => Math.abs(prevY - node.y) < 20,
      );

      let pillX: number;
      if (collidesOnRight) {
        // Place on left side of playhead
        pillX = playheadX - 14 - pillWidth;
      } else {
        // Place on right side of playhead
        pillX = playheadX + 14;
        rightSideYHistory.push(node.y);
      }

      // Rounded badge pill background
      ctx.shadowColor = 'rgba(45, 27, 78, 0.16)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 1;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.94)';
      ctx.strokeStyle = 'rgba(45, 27, 78, 0.18)';
      ctx.lineWidth = 1;

      ctx.beginPath();
      drawRoundedRect(ctx, pillX, pillY, pillWidth, pillHeight, 4);
      ctx.fill();
      ctx.stroke();

      // Dark indigo label text
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
      ctx.fillStyle = '#2D1B4E';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, pillX + pillWidth / 2, node.y);

      ctx.restore();
    }

    ctx.restore();
  }, [
    dimensions,
    maxMidi,
    minMidi,
    midiOptions,
    paddingY,
    playheadRatio,
    progress,
    progression,
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

  // Pointer event handlers for interactive scrub and seek
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
        'relative w-full h-full min-h-[300px] overflow-hidden select-none',
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
