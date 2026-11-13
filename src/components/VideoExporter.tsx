import React, { useState, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { Download, Loader2, Video, CheckCircle2 } from 'lucide-react';
import { ProgressionTimeline, ChordStep } from '../types/music';
import { getThemePreset, ThemePreset } from '../engine/themes/themePresets';
import {
  DEFAULT_TRANSITION_BEATS,
  MidiYMappingOptions,
  getVoiceRibbonSegments,
  getVoiceStateAtBeat,
  midiToY,
} from '../utils/splineMath';

/**
 * Props for the VideoExporter component.
 */
export interface VideoExporterProps {
  progression: ProgressionTimeline;
  theme?: string | ThemePreset;
  instrument?: 'guitar' | 'keyboard';
  audioElement: HTMLAudioElement | null;
  className?: string;
}

/**
 * Parses chord symbol into root, accidental, and extension for hero typography.
 */
function parseChordDisplay(step: ChordStep): {
  root: string;
  accidental: string;
  extension: string;
} {
  if (step.chordRoot) {
    const rawAcc = step.chordAccidental ?? '';
    const acc = rawAcc === 'b' ? '♭' : rawAcc === '#' ? '♯' : rawAcc;
    return {
      root: step.chordRoot,
      accidental: acc,
      extension: step.chordExtension ?? '',
    };
  }

  const match = step.chordName.match(/^([A-G])([b#]?)(.*)$/);
  if (match && match[1]) {
    const rawAcc = match[2] ?? '';
    const acc = rawAcc === 'b' ? '♭' : rawAcc === '#' ? '♯' : rawAcc;
    return {
      root: match[1],
      accidental: acc,
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
 * Component that records and exports a pristine 1080x1920 60FPS vertical video
 * ready for YouTube Shorts, Instagram Reels, or TikTok.
 *
 * Implements the authentic Swan Glide visualizer aesthetics:
 * - Silky smooth cubic Hermite S-curve note glides between chords
 * - Statuesque hero chord typography with aligned accidentals and step progress dots
 * - Continuous glowing neon voice ribbons with translucent previews and specular glints
 * - Refined centered guitar fretboard or illuminated piano keyboard diagrams
 * - Minimalist, editorial watermark branding
 */
export const VideoExporter: React.FC<VideoExporterProps> = ({
  progression,
  theme = 'pastel',
  instrument = 'guitar',
  audioElement,
  className,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const themePreset: ThemePreset =
    typeof theme === 'string' ? getThemePreset(theme) : theme;
  const isDark = themePreset.isDark;

  const recorderRef = useRef<MediaRecorder | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startExport = useCallback(async () => {
    if (isRecording) {
      return;
    }

    try {
      setIsRecording(true);
      setProgressPercent(0);
      setDownloadUrl(null);

      // Create offscreen 1080x1920 canvas for video rendering
      const exportCanvas = document.createElement('canvas');
      exportCanvas.width = 1080;
      exportCanvas.height = 1920;
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) {
        throw new Error('Could not create export canvas context');
      }

      // Audio setup
      const audioCtx = new AudioContext();
      if (audioCtx.state === 'suspended') {
        try {
          await audioCtx.resume();
        } catch {
          // Ignore
        }
      }
      const audioStreamDestination = audioCtx.createMediaStreamDestination();
      let bufferSource: AudioBufferSourceNode | null = null;

      try {
        const audioResponse = await fetch(`${import.meta.env.BASE_URL}audio/swan_glide_reference.mp3`);
        if (audioResponse.ok) {
          const audioArrayBuffer = await audioResponse.arrayBuffer();
          const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);

          bufferSource = audioCtx.createBufferSource();
          bufferSource.buffer = audioBuffer;
          bufferSource.connect(audioStreamDestination);
          bufferSource.connect(audioCtx.destination);
          // bufferSource will be started in exact lockstep when recorder starts
        }
      } catch (audioErr) {
        console.warn('Audio reference track unavailable for export', audioErr);
      }

      // Capture 60fps video stream from canvas
      const canvasStream = exportCanvas.captureStream(60);
      const audioTracks = bufferSource
        ? audioStreamDestination.stream.getAudioTracks()
        : [];
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioTracks,
      ]);

      // Choose supported mimeType prioritizing fast, hardware-friendly encoders
      let mimeType = 'video/mp4';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp8,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm;codecs=vp9,opus';
      }
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps high quality without encoder drops
      });
      recorderRef.current = recorder;

      const recordedChunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        try {
          const videoBlob = new Blob(recordedChunks, { type: mimeType });
          const url = URL.createObjectURL(videoBlob);
          setDownloadUrl(url);
          setIsRecording(false);
          setProgressPercent(100);

          try {
            audioCtx.close();
          } catch {
            // Ignore AudioContext close error
          }

          // Auto trigger download
          const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
          const a = document.createElement('a');
          a.href = url;
          a.download = `swan_glide_short_${Date.now()}.${ext}`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
        } catch (stopErr) {
          console.error('Failed to finalize video export:', stopErr);
          setIsRecording(false);
        }
      };

      recorder.onerror = (event) => {
        console.error('MediaRecorder error during export:', event);
        setIsRecording(false);
        try {
          audioCtx.close();
        } catch {
          // Ignore
        }
      };

      const totalDurationSeconds =
        progression.getTotalDurationSeconds() || 24.0;
      const totalBeats = progression.getTotalBeats();
      const numSteps = progression.steps.length;

      // Visual timeline sync offset in seconds:
      // 1. Compensates for human rubato anticipation in the studio recording (~0.45s early chord strikes)
      // 2. Compensates for browser canvas captureStream & video encoder pipeline latency (~0.15s)
      const VIDEO_SYNC_OFFSET_SECONDS = 0.60;

      let audioStartTime: number | null = null;
      let perfStartTime = performance.now();

      // 60FPS render loop
      const drawFrame = (now: number, scheduleNext: boolean = true) => {
        const rawElapsed =
          audioStartTime !== null && audioCtx.state === 'running'
            ? Math.max(0, audioCtx.currentTime - audioStartTime)
            : Math.max(0, (now - perfStartTime) / 1000);

        const elapsed = rawElapsed + VIDEO_SYNC_OFFSET_SECONDS;

        const currentPercent = Math.min(
          100,
          Math.floor((rawElapsed / totalDurationSeconds) * 100),
        );
        setProgressPercent(currentPercent);

        // 1. Draw refined background gradient
        ctx.save();
        const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
        if (isDark) {
          bgGrad.addColorStop(0, '#16091b');
          bgGrad.addColorStop(0.45, '#0d0512');
          bgGrad.addColorStop(1, '#050208');
        } else if (themePreset.id === 'sunset') {
          bgGrad.addColorStop(0, '#ffe5d9');
          bgGrad.addColorStop(0.5, '#ffd1dc');
          bgGrad.addColorStop(1, '#f9c5d1');
        } else if (themePreset.id === 'lofi') {
          bgGrad.addColorStop(0, '#dbeafe');
          bgGrad.addColorStop(0.5, '#e0e7ff');
          bgGrad.addColorStop(1, '#ede9fe');
        } else if (themePreset.id === 'cream') {
          bgGrad.addColorStop(0, '#fefae0');
          bgGrad.addColorStop(0.5, '#faedcd');
          bgGrad.addColorStop(1, '#e9d8a6');
        } else {
          // Pastel default
          bgGrad.addColorStop(0, '#fce7f3');
          bgGrad.addColorStop(0.45, '#fbcfe8');
          bgGrad.addColorStop(1, '#f5d0fe');
        }
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, 1080, 1920);
        ctx.restore();

        // 2. Resolve active step and timeline beat
        const normalizedProgress =
          ((elapsed % totalDurationSeconds) + totalDurationSeconds) %
          totalDurationSeconds /
          totalDurationSeconds;
        const currentBeat = normalizedProgress * totalBeats;
        const stepRes = progression.getStepAtBeat(currentBeat);
        const currentStep = stepRes.step;
        const stepIndex = stepRes.stepIndex;

        // 3. Render Header Chord Display (y: 100 to 350)
        ctx.save();

        // Micro-Header: Harmonic Step Indicators
        const dotSpacing = 22;
        const totalDotsW = (numSteps - 1) * dotSpacing + 28;
        const startDotX = 540 - totalDotsW / 2;
        for (let i = 0; i < numSteps; i++) {
          const isActive = i === stepIndex;
          const dotX =
            startDotX + i * dotSpacing + (i > stepIndex ? 18 : 0);
          const dotW = isActive ? 28 : 8;
          ctx.save();
          ctx.fillStyle = isActive
            ? themePreset.accentColor
            : isDark
            ? 'rgba(255, 255, 255, 0.22)'
            : 'rgba(46, 16, 77, 0.22)';
          if (isActive) {
            ctx.shadowColor = themePreset.accentColor;
            ctx.shadowBlur = 12;
          }
          ctx.beginPath();
          ctx.roundRect(dotX, 120, dotW, 6, 3);
          ctx.fill();
          ctx.restore();
        }

        // Hero Chord Typography with natural accidental alignment
        const { root, accidental, extension } = parseChordDisplay(currentStep);

        ctx.font = '900 115px "Outfit", "Plus Jakarta Sans", sans-serif';
        const rootWidth = ctx.measureText(root).width;

        ctx.font = '800 60px "Outfit", "Plus Jakarta Sans", sans-serif';
        const accWidth = accidental ? ctx.measureText(accidental).width + 6 : 0;

        ctx.font = '800 68px "Outfit", "Plus Jakarta Sans", sans-serif';
        const extWidth = extension ? ctx.measureText(extension).width : 0;

        const totalChordW = rootWidth + accWidth + extWidth;
        const chordStartX = 540 - totalChordW / 2;
        const chordBaseY = 248;

        // Root note
        ctx.fillStyle = themePreset.textColor;
        ctx.font = '900 115px "Outfit", "Plus Jakarta Sans", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(root, chordStartX, chordBaseY);

        // Optically aligned accidental
        if (accidental) {
          ctx.fillStyle = themePreset.accentColor;
          ctx.font = '800 60px "Outfit", "Plus Jakarta Sans", sans-serif';
          ctx.fillText(accidental, chordStartX + rootWidth + 2, chordBaseY - 34);
        }

        // Chord extension
        if (extension) {
          ctx.fillStyle = themePreset.textColor;
          ctx.font = '800 68px "Outfit", "Plus Jakarta Sans", sans-serif';
          ctx.fillText(extension, chordStartX + rootWidth + accWidth, chordBaseY);
        }

        // Subtitle attribution handle
        ctx.font = '600 24px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = themePreset.textMutedColor;
        ctx.textAlign = 'center';
        ctx.fillText(
          currentStep.artistHandle || '@ultravioletchorus',
          540,
          305,
        );
        ctx.restore();

        // 4. Render Voice-Leading Spline Timeline (y: 370 to 1420)
        const canvasY = 370;
        const canvasHeight = 1040;
        const playheadRatio = 0.37;
        const playheadX = 1080 * playheadRatio; // 399.6px
        const visibleBeats = 8.0;
        const pxPerBeat = 1080 / visibleBeats; // 135px per beat
        const minMidi = 32;
        const maxMidi = 84;

        const midiOptions: MidiYMappingOptions = {
          minMidi,
          maxMidi,
          paddingTop: canvasY,
          paddingBottom: 1920 - (canvasY + canvasHeight),
        };

        // Semitone guide lines
        ctx.save();
        ctx.strokeStyle = themePreset.gridLineColor;
        ctx.lineWidth = 0.8;
        for (let midi = minMidi; midi <= maxMidi; midi++) {
          if (midi % 12 === 0) continue;
          const normY = (midi - minMidi) / (maxMidi - minMidi);
          const py = canvasY + (1 - normY) * canvasHeight;
          ctx.beginPath();
          ctx.moveTo(36, py);
          ctx.lineTo(1080, py);
          ctx.stroke();
        }

        // Prominent octave reference lines and left pitch labels
        const octaveNotes = [
          { midi: 36, label: 'C2' },
          { midi: 48, label: 'C3' },
          { midi: 60, label: 'C4' },
          { midi: 72, label: 'C5' },
          { midi: 84, label: 'C6' },
        ];
        for (const oct of octaveNotes) {
          const normY = (oct.midi - minMidi) / (maxMidi - minMidi);
          const py = canvasY + (1 - normY) * canvasHeight;

          ctx.strokeStyle = isDark
            ? 'rgba(255, 255, 255, 0.16)'
            : 'rgba(46, 16, 77, 0.16)';
          ctx.lineWidth = 1.2;
          ctx.setLineDash([4, 5]);
          ctx.beginPath();
          ctx.moveTo(48, py);
          ctx.lineTo(1080, py);
          ctx.stroke();
          ctx.setLineDash([]);

          ctx.font = '600 16px "JetBrains Mono", monospace';
          ctx.fillStyle = themePreset.textMutedColor;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(oct.label, 12, py);
        }
        ctx.restore();

        // Bar line dividers and upcoming chord headers
        ctx.save();
        let stepStartAccumulator = 0;
        for (let i = 0; i < progression.steps.length; i++) {
          const s = progression.steps[i];
          if (!s) continue;
          const stepStart = stepStartAccumulator;
          stepStartAccumulator += s.durationBeats;

          // Render across loop repetitions
          for (
            let loopOffset = -totalBeats * 2;
            loopOffset <= totalBeats * 2;
            loopOffset += totalBeats
          ) {
            const beatPos = stepStart + loopOffset;
            const bx = playheadX + (beatPos - currentBeat) * pxPerBeat;

            if (bx >= -80 && bx <= 1160) {
              ctx.strokeStyle = themePreset.barLineColor;
              ctx.lineWidth = 1.2;
              ctx.beginPath();
              ctx.moveTo(bx, canvasY + 28);
              ctx.lineTo(bx, canvasY + canvasHeight - 12);
              ctx.stroke();

              // Chord label pill
              if (bx > playheadX + 35 || bx < playheadX - 80) {
                ctx.font = '700 18px "Plus Jakarta Sans", sans-serif';
                const chordText = s.chordName;
                const textWidth = ctx.measureText(chordText).width;
                const pillW = textWidth + 18;
                const pillH = 26;

                ctx.fillStyle = isDark
                  ? 'rgba(12, 9, 20, 0.85)'
                  : 'rgba(255, 255, 255, 0.90)';
                ctx.beginPath();
                ctx.roundRect(bx + 8, canvasY - 14, pillW, pillH, 6);
                ctx.fill();

                ctx.fillStyle = isDark
                  ? 'rgba(255, 255, 255, 0.85)'
                  : themePreset.textColor;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(chordText, bx + 17, canvasY - 1);
              }
            }
          }
        }
        ctx.restore();

        // Render continuous voice ribbon splines
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
            1080,
            1920,
            visibleBeats,
            playheadRatio,
            midiOptions,
            DEFAULT_TRANSITION_BEATS,
          );

          if (segments.length === 0) continue;

          const voiceColor =
            palette[v % palette.length] ??
            progression.steps[0]?.voices[v]?.color ??
            '#A855F7';

          // Helper to build the continuous smooth ribbon path across all visible segments
          const buildRibbonPath = () => {
            ctx.beginPath();
            let lastX = -999999;
            let lastY = -999999;
            for (const seg of segments) {
              if (
                Math.abs(seg.xStart - lastX) > 1 ||
                Math.abs(seg.yStart - lastY) > 1
              ) {
                ctx.moveTo(seg.xStart, seg.yStart);
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
              lastX = seg.xEnd;
              lastY = seg.yEnd;
            }
          };

          // Pass 1: Future preview (right of playhead) in soft translucent stroke
          ctx.save();
          ctx.beginPath();
          ctx.rect(playheadX, 0, 1080 - playheadX, 1920);
          ctx.clip();

          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 4.0;
          ctx.strokeStyle = voiceColor;
          ctx.globalAlpha = isDark ? 0.40 : 0.35;

          buildRibbonPath();
          ctx.stroke();
          ctx.restore();

          // Pass 2: Active trail (left of playhead) with vibrant neon glow
          ctx.save();
          ctx.beginPath();
          ctx.rect(0, 0, playheadX + 1, 1920);
          ctx.clip();

          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.lineWidth = 6.0;
          ctx.strokeStyle = voiceColor;
          ctx.shadowColor = voiceColor;
          ctx.shadowBlur = isDark ? 24 : 14;

          buildRibbonPath();
          ctx.stroke();

          // Pass 3: White specular center glint for high-end glass tube sheen
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = '#FFFFFF';
          ctx.globalAlpha = isDark ? 0.45 : 0.65;
          ctx.shadowBlur = 0;

          buildRibbonPath();
          ctx.stroke();
          ctx.restore();
        }

        // Vertical playhead line
        ctx.save();
        ctx.strokeStyle = themePreset.playheadColor;
        ctx.shadowColor = themePreset.playheadGlowColor;
        ctx.shadowBlur = themePreset.playheadGlowBlur;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(playheadX, canvasY);
        ctx.lineTo(playheadX, canvasY + canvasHeight);
        ctx.stroke();
        ctx.restore();

        // 5. Active voice playhead nodes - SILKY SMOOTH GLIDES
        for (let v = 0; v < maxVoices; v++) {
          const voiceState = getVoiceStateAtBeat(
            progression,
            v,
            currentBeat,
            DEFAULT_TRANSITION_BEATS,
          );
          const nodeY = midiToY(voiceState.midi, 1920, midiOptions);
          const nodeColor = palette[v % palette.length] ?? voiceState.color;

          // Triple-layered glowing playhead node
          ctx.save();
          // Halo glow
          ctx.shadowColor = nodeColor;
          ctx.shadowBlur = isDark ? 22 : 14;
          ctx.fillStyle = nodeColor;
          ctx.beginPath();
          ctx.arc(playheadX, nodeY, 11, 0, Math.PI * 2);
          ctx.fill();

          // Soft semi-transparent outer ring
          ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
          ctx.beginPath();
          ctx.arc(playheadX, nodeY, 15, 0, Math.PI * 2);
          ctx.fill();

          // Sharp white center dot
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(playheadX, nodeY, 4.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();

          // Floating pill badge with formatted accidental
          const formattedLabel = voiceState.label
            .replace('b', '♭')
            .replace('#', '♯');
          ctx.save();
          ctx.font = '700 24px "Plus Jakarta Sans", -apple-system, sans-serif';
          const textMetrics = ctx.measureText(formattedLabel);
          const pillW = Math.max(textMetrics.width + 24, 68);
          const pillH = 34;
          const pillX = playheadX + 22;
          const pillY = nodeY - pillH / 2;
          const radius = pillH / 2;

          ctx.beginPath();
          ctx.roundRect(pillX, pillY, pillW, pillH, radius);
          ctx.fillStyle = isDark
            ? 'rgba(15, 12, 24, 0.90)'
            : 'rgba(255, 255, 255, 0.94)';
          ctx.fill();
          ctx.strokeStyle = isDark
            ? 'rgba(255, 255, 255, 0.15)'
            : 'rgba(46, 16, 77, 0.12)';
          ctx.lineWidth = 1.5;
          ctx.stroke();

          ctx.fillStyle = nodeColor;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(formattedLabel, pillX + pillW / 2, nodeY);
          ctx.restore();
        }

        // 6. Render Bottom Section (Guitar Fretboard or Piano Keyboard)
        const bottomY = 1480;
        const mainColor = themePreset.textColor;
        const mutedColor = themePreset.textMutedColor;

        if (instrument === 'keyboard') {
          // Render Illuminated Piano Keyboard
          ctx.save();
          ctx.font =
            '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = mutedColor;
          ctx.textAlign = 'center';
          ctx.fillText('PIANO', 540, bottomY);

          const startMidiK = 36;
          const endMidiK = 81;
          const blackPitchClasses = [1, 3, 6, 8, 10];

          let totalWhiteKeys = 0;
          for (let m = startMidiK; m <= endMidiK; m++) {
            if (!blackPitchClasses.includes(m % 12)) totalWhiteKeys++;
          }

          const kw = 920;
          const whiteWidth = kw / totalWhiteKeys;
          const whiteHeight = 175;
          const blackWidth = whiteWidth * 0.62;
          const blackHeight = whiteHeight * 0.62;
          const kx = (1080 - kw) / 2;
          const ky = bottomY + 28;

          const activeVoicesByMidi = new Map<number, { color: string; label: string }>();
          for (let v = 0; v < maxVoices; v++) {
            const vState = getVoiceStateAtBeat(
              progression,
              v,
              currentBeat,
              DEFAULT_TRANSITION_BEATS,
            );
            const roundedMidi = Math.round(vState.midi);
            activeVoicesByMidi.set(roundedMidi, {
              color: palette[v % palette.length] ?? vState.color,
              label: vState.label.replace('b', '♭').replace('#', '♯'),
            });
          }

          // Pass 1: White keys
          let whiteIdx = 0;
          for (let m = startMidiK; m <= endMidiK; m++) {
            const pc = m % 12;
            if (blackPitchClasses.includes(pc)) continue;

            const wx = kx + whiteIdx * whiteWidth;
            const voice = activeVoicesByMidi.get(m);

            ctx.lineWidth = 1.5;
            ctx.strokeStyle = themePreset.keyboardWhiteKeyStroke;

            if (voice) {
              ctx.fillStyle = voice.color;
              ctx.shadowColor = voice.color;
              ctx.shadowBlur = 18;
            } else {
              ctx.fillStyle = themePreset.keyboardWhiteKeyFill;
              ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.roundRect(wx, ky, whiteWidth - 1, whiteHeight, [0, 0, 5, 5]);
            ctx.fill();
            ctx.stroke();

            if (voice) {
              ctx.shadowBlur = 0;
              ctx.font = '700 16px "Plus Jakarta Sans", sans-serif';
              ctx.fillStyle = '#FFFFFF';
              ctx.textAlign = 'center';
              ctx.fillText(voice.label, wx + whiteWidth / 2, ky + whiteHeight - 14);
            }
            whiteIdx++;
          }

          // Pass 2: Black keys
          whiteIdx = 0;
          for (let m = startMidiK; m <= endMidiK; m++) {
            const pc = m % 12;
            if (!blackPitchClasses.includes(pc)) {
              whiteIdx++;
              continue;
            }

            const wxPreceding = kx + (whiteIdx - 1) * whiteWidth;
            const bx = wxPreceding + whiteWidth - blackWidth / 2;
            const voice = activeVoicesByMidi.get(m);

            ctx.lineWidth = 1.2;
            ctx.strokeStyle = themePreset.keyboardBlackKeyStroke;

            if (voice) {
              ctx.fillStyle = voice.color;
              ctx.shadowColor = voice.color;
              ctx.shadowBlur = 20;
            } else {
              ctx.fillStyle = themePreset.keyboardBlackKeyFill;
              ctx.shadowBlur = 0;
            }

            ctx.beginPath();
            ctx.roundRect(bx, ky, blackWidth, blackHeight, [0, 0, 4, 4]);
            ctx.fill();
            ctx.stroke();

            if (voice) {
              ctx.shadowBlur = 0;
              ctx.font = '700 13px "Plus Jakarta Sans", sans-serif';
              ctx.fillStyle = '#FFFFFF';
              ctx.textAlign = 'center';
              ctx.fillText(voice.label, bx + blackWidth / 2, ky + blackHeight - 12);
            }
          }
          ctx.restore();
        } else {
          // Render Centered Tactile Guitar Fretboard
          ctx.save();
          ctx.font =
            '700 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
          ctx.fillStyle = mutedColor;
          ctx.textAlign = 'center';
          ctx.fillText('GUITAR', 540, bottomY);

          const gw = 380;
          const gh = 250;
          const gx = (1080 - gw) / 2;
          const gy = bottomY + 36;
          const numStrings = 6;
          const numFrets = 5;
          const stringSpacing = gw / (numStrings - 1);
          const fretSpacing = gh / numFrets;

          const voicing = currentStep.guitarDiagram || {
            frets: ['x', 'x', 'x', 'x', 'x', 'x'],
            stringNotes: [],
          };
          const baseFret = voicing.baseFret || 1;
          const isNut = baseFret <= 1;

          // Base fret indicator on left
          if (!isNut) {
            ctx.font = '700 24px "Plus Jakarta Sans", sans-serif';
            ctx.fillStyle = mutedColor;
            ctx.textAlign = 'right';
            ctx.fillText(`${baseFret}fr`, gx - 16, gy + fretSpacing * 0.75);
          }

          // Horizontal frets
          ctx.lineWidth = 2.0;
          ctx.strokeStyle = isDark
            ? 'rgba(255, 255, 255, 0.22)'
            : 'rgba(46, 16, 77, 0.30)';
          for (let f = 0; f <= numFrets; f++) {
            const fy = gy + f * fretSpacing;
            ctx.beginPath();
            ctx.moveTo(gx, fy);
            ctx.lineTo(gx + gw, fy);
            ctx.stroke();
          }

          // Nut bar (thick top line)
          if (isNut) {
            ctx.lineWidth = 8.0;
            ctx.strokeStyle = mainColor;
            ctx.beginPath();
            ctx.moveTo(gx - 2, gy);
            ctx.lineTo(gx + gw + 2, gy);
            ctx.stroke();
          }

          // Vertical strings with realistic gauge gradations (thick to thin)
          for (let s = 0; s < numStrings; s++) {
            const sx = gx + s * stringSpacing;
            const gauge = 3.5 - s * 0.45;
            ctx.lineWidth = gauge;
            ctx.strokeStyle = isDark
              ? 'rgba(255, 255, 255, 0.35)'
              : 'rgba(46, 16, 77, 0.40)';
            ctx.beginPath();
            ctx.moveTo(sx, gy);
            ctx.lineTo(sx, gy + gh);
            ctx.stroke();
          }

          // Barre indicator pill
          const barres = voicing.barres || [];
          for (const barre of barres) {
            const relFret = barre.fret - baseFret + 1;
            if (relFret >= 1 && relFret <= numFrets) {
              const fromIdx = 6 - barre.fromString;
              const toIdx = 6 - barre.toString;
              const bx1 = gx + Math.min(fromIdx, toIdx) * stringSpacing;
              const bx2 = gx + Math.max(fromIdx, toIdx) * stringSpacing;
              const by = gy + (relFret - 0.5) * fretSpacing;
              const pillH = 22;

              ctx.fillStyle = mainColor;
              ctx.beginPath();
              ctx.roundRect(
                bx1 - 12,
                by - pillH / 2,
                bx2 - bx1 + 24,
                pillH,
                pillH / 2,
              );
              ctx.fill();
            }
          }

          // Top markers ('x' for mute, 'o' for open) and finger dots
          for (let s = 0; s < numStrings; s++) {
            const sx = gx + s * stringSpacing;
            const fret = voicing.frets ? voicing.frets[s] : 'x';

            if (fret === 'x') {
              ctx.strokeStyle = mutedColor;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.moveTo(sx - 7, gy - 18 - 7);
              ctx.lineTo(sx + 7, gy - 18 + 7);
              ctx.moveTo(sx + 7, gy - 18 - 7);
              ctx.lineTo(sx - 7, gy - 18 + 7);
              ctx.stroke();
            } else if (fret === 0) {
              ctx.strokeStyle = mainColor;
              ctx.lineWidth = 2.5;
              ctx.beginPath();
              ctx.arc(sx, gy - 18, 7, 0, Math.PI * 2);
              ctx.stroke();
            } else if (typeof fret === 'number' && fret > 0) {
              const relFret = fret - baseFret + 1;
              if (relFret >= 1 && relFret <= numFrets) {
                const dy = gy + (relFret - 0.5) * fretSpacing;
                ctx.fillStyle = mainColor;
                ctx.beginPath();
                ctx.arc(sx, dy, 14, 0, Math.PI * 2);
                ctx.fill();
              }
            }

            // Bottom note name label with musical glyphs
            const rawNote = voicing.stringNotes?.[s];
            if (rawNote && rawNote !== 'x') {
              const noteGlyph = rawNote
                .replace('#', '♯')
                .replace('b', '♭');
              ctx.font = '700 20px "Plus Jakarta Sans", monospace';
              ctx.fillStyle = mutedColor;
              ctx.textAlign = 'center';
              ctx.fillText(noteGlyph, sx, gy + gh + 30);
            }
          }
          ctx.restore();
        }

        // Minimalist editorial watermark branding
        ctx.save();
        ctx.textAlign = 'center';
        ctx.font = '800 20px "Outfit", "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = isDark
          ? 'rgba(255, 255, 255, 0.40)'
          : 'rgba(46, 16, 77, 0.45)';
        ctx.fillText('SWAN GLIDE', 540, 1836);

        ctx.font = '600 13px "Plus Jakarta Sans", sans-serif';
        ctx.fillStyle = isDark
          ? 'rgba(255, 255, 255, 0.25)'
          : 'rgba(46, 16, 77, 0.30)';
        ctx.fillText('NEO-SOUL VOICE LEADING', 540, 1858);
        ctx.restore();

        // Loop condition
        if (scheduleNext) {
          if (rawElapsed < totalDurationSeconds) {
            animationFrameRef.current = requestAnimationFrame((t) =>
              drawFrame(t, true),
            );
          } else {
            // Finished recording
            if (bufferSource) {
              try {
                bufferSource.stop();
              } catch {
                // Ignore audio stop error
              }
            }
            recorder.stop();
          }
        }
      };

      // 1. Draw initial frame at t = 0 without scheduling animation frames prematurely
      drawFrame(perfStartTime, false);

      // 2. Start recorder
      recorder.start(100);

      // 3. Start audio in exact sync with recorder
      audioStartTime = audioCtx.currentTime;
      if (bufferSource) {
        bufferSource.start(audioStartTime);
      }
      perfStartTime = performance.now();

      // 4. Begin single continuous animation loop
      animationFrameRef.current = requestAnimationFrame((t) =>
        drawFrame(t, true),
      );
    } catch (err) {
      console.error('Failed to export video:', err);
      setIsRecording(false);
    }
  }, [
    audioElement,
    instrument,
    isDark,
    isRecording,
    progression,
    themePreset,
  ]);

  return (
    <div className={clsx('flex items-center gap-2 select-none', className)}>
      <button
        type="button"
        onClick={startExport}
        disabled={isRecording}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-xs tracking-wide shadow-md transition-all duration-200 cursor-pointer',
          isRecording
            ? 'bg-purple-600 text-white cursor-wait opacity-90'
            : isDark
            ? 'bg-amber-400 hover:bg-amber-300 text-zinc-950 hover:shadow-lg hover:scale-105'
            : 'bg-[#2E104D] hover:bg-[#3E1A63] text-white hover:shadow-lg hover:scale-105',
        )}
        aria-label="Export YouTube Short (1080x1920 60FPS Video)"
      >
        {isRecording ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin text-white" />
            <span>Rendering Short ({progressPercent}%)...</span>
          </>
        ) : downloadUrl ? (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Exported! Click to Re-export</span>
          </>
        ) : (
          <>
            <Video className="w-4 h-4" />
            <span>Download Short (1080x1920)</span>
          </>
        )}
      </button>

      {downloadUrl && (
        <a
          href={downloadUrl}
          download={`swan_glide_short_${Date.now()}.webm`}
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-600 text-white font-medium text-xs shadow-md hover:bg-emerald-500 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save Video</span>
        </a>
      )}
    </div>
  );
};
