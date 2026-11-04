import React, { useState, useRef, useCallback } from 'react';
import clsx from 'clsx';
import { Download, Loader2, Video, CheckCircle2 } from 'lucide-react';
import { ProgressionTimeline } from '../types/music';

/**
 * Props for the VideoExporter component.
 */
export interface VideoExporterProps {
  progression: ProgressionTimeline;
  theme?: 'pastel' | 'dark';
  audioElement: HTMLAudioElement | null;
  className?: string;
}

/**
 * Component that records and exports a pristine 1080x1920 60FPS vertical video
 * ready for YouTube Shorts, Instagram Reels, or TikTok.
 */
export const VideoExporter: React.FC<VideoExporterProps> = ({
  progression,
  theme = 'pastel',
  audioElement,
  className,
}) => {
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const isDark = theme === 'dark';
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
      const audioStreamDestination = audioCtx.createMediaStreamDestination();

      // Load reference audio for export
      const audioResponse = await fetch('/audio/swan_glide_reference.mp3');
      const audioArrayBuffer = await audioResponse.arrayBuffer();
      const audioBuffer = await audioCtx.decodeAudioData(audioArrayBuffer);

      const bufferSource = audioCtx.createBufferSource();
      bufferSource.buffer = audioBuffer;
      bufferSource.connect(audioStreamDestination);
      bufferSource.connect(audioCtx.destination);

      // Capture 60fps video stream from canvas
      const canvasStream = exportCanvas.captureStream(60);
      const combinedStream = new MediaStream([
        ...canvasStream.getVideoTracks(),
        ...audioStreamDestination.stream.getAudioTracks(),
      ]);

      // Choose supported mimeType
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }

      const recorder = new MediaRecorder(combinedStream, {
        mimeType,
        videoBitsPerSecond: 8000000, // 8 Mbps high quality
      });
      recorderRef.current = recorder;

      const recordedChunks: Blob[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          recordedChunks.push(e.data);
        }
      };

      const totalDurationSeconds = 24.0; // 1 full progression loop
      const startTime = performance.now();

      bufferSource.start(0);
      recorder.start(100);

      // 60FPS render loop
      const drawFrame = () => {
        const elapsed = (performance.now() - startTime) / 1000;
        const currentPercent = Math.min(100, Math.floor((elapsed / totalDurationSeconds) * 100));
        setProgressPercent(currentPercent);

        // 1. Draw background
        if (isDark) {
          const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
          bgGrad.addColorStop(0, '#1c0808');
          bgGrad.addColorStop(0.5, '#120404');
          bgGrad.addColorStop(1, '#0a0202');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, 1080, 1920);
        } else {
          const bgGrad = ctx.createLinearGradient(0, 0, 0, 1920);
          bgGrad.addColorStop(0, '#fad4e6');
          bgGrad.addColorStop(0.5, '#f7cfe3');
          bgGrad.addColorStop(1, '#fad6e8');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(0, 0, 1080, 1920);
        }

        // 2. Resolve active step
        const normalizedProgress = (elapsed % totalDurationSeconds) / totalDurationSeconds;
        const currentBeat = normalizedProgress * progression.getTotalBeats();
        const stepRes = progression.getStepAtBeat(currentBeat);
        const step = stepRes.step;

        // 3. Render Header Chord Typography
        ctx.save();
        const headerTextColor = isDark ? '#FFFFFF' : '#2E104D';
        ctx.fillStyle = headerTextColor;
        ctx.textAlign = 'center';

        // Root note
        ctx.font = '900 130px Inter, system-ui, sans-serif';
        const chordStr = step.chordName;
        ctx.fillText(chordStr, 540, 260);

        // Subtitle handle
        ctx.font = '500 32px Inter, system-ui, sans-serif';
        ctx.fillStyle = isDark ? '#A1A1AA' : 'rgba(46, 16, 77, 0.7)';
        ctx.fillText(step.artistHandle || '@ultravioletchorus', 540, 320);
        ctx.restore();

        // 4. Render Voice-Leading Canvas Area (y: 380 to 1420)
        const canvasY = 400;
        const canvasHeight = 980;
        const playheadX = 1080 * 0.37;

        // Faint horizontal pitch grid lines
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(46, 16, 77, 0.05)';
        ctx.lineWidth = 1.5;
        for (let midi = 32; midi <= 84; midi++) {
          const normY = (midi - 32) / (84 - 32);
          const py = canvasY + (1 - normY) * canvasHeight;
          ctx.beginPath();
          ctx.moveTo(0, py);
          ctx.lineTo(1080, py);
          ctx.stroke();
        }
        ctx.restore();

        // Bar line dividers
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.18)' : 'rgba(46, 16, 77, 0.2)';
        ctx.lineWidth = 1.5;

        let accum = 0;
        for (let i = 0; i < progression.steps.length; i++) {
          const s = progression.steps[i];
          if (!s) continue;
          const beatDiff = accum - currentBeat;
          const bx = playheadX + beatDiff * (1080 / 8);

          if (bx >= -100 && bx <= 1180) {
            ctx.beginPath();
            ctx.moveTo(bx, canvasY);
            ctx.lineTo(bx, canvasY + canvasHeight);
            ctx.stroke();

            ctx.font = '600 24px Inter, system-ui, sans-serif';
            ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.65)' : 'rgba(46, 16, 77, 0.55)';
            ctx.textAlign = 'left';
            ctx.fillText(s.chordName, bx + 12, canvasY - 12);
          }
          accum += s.durationBeats;
        }
        ctx.restore();

        // Playhead vertical line
        ctx.save();
        ctx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(46, 16, 77, 0.3)';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(playheadX, canvasY);
        ctx.lineTo(playheadX, canvasY + canvasHeight);
        ctx.stroke();
        ctx.restore();

        // 5. Draw active voice nodes & pitch labels
        const activeVoices = step.voices;
        for (const voice of activeVoices) {
          const normY = (voice.midi - 32) / (84 - 32);
          const vy = canvasY + (1 - normY) * canvasHeight;

          ctx.save();
          // Halo glow
          ctx.shadowColor = voice.color;
          ctx.shadowBlur = 24;
          ctx.fillStyle = voice.color;
          ctx.beginPath();
          ctx.arc(playheadX, vy, 14, 0, Math.PI * 2);
          ctx.fill();

          // White center
          ctx.shadowBlur = 0;
          ctx.fillStyle = '#FFFFFF';
          ctx.beginPath();
          ctx.arc(playheadX, vy, 5, 0, Math.PI * 2);
          ctx.fill();

          // Clean pitch label to the right
          ctx.font = '700 28px Inter, system-ui, sans-serif';
          ctx.fillStyle = voice.color;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'middle';
          ctx.fillText(voice.label, playheadX + 26, vy);
          ctx.restore();
        }

        // 6. Draw Bottom Section (Guitar + Swan Glide watermark)
        ctx.save();
        const bottomY = 1520;
        const mainColor = isDark ? '#FFFFFF' : '#2E104D';
        const mutedColor = isDark ? '#A1A1AA' : 'rgba(46, 16, 77, 0.6)';

        // Left: GUITAR label
        ctx.font = '700 24px Inter, system-ui, sans-serif';
        ctx.fillStyle = mutedColor;
        ctx.textAlign = 'center';
        ctx.fillText('GUITAR', 270, bottomY);

        // Draw guitar fret box
        const gx = 130;
        const gy = bottomY + 30;
        const gw = 280;
        const gh = 230;

        ctx.strokeStyle = mainColor;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(gx, gy);
        ctx.lineTo(gx + gw, gy);
        ctx.stroke();

        // Frets
        ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.25)' : 'rgba(46,16,77,0.35)';
        ctx.lineWidth = 2;
        for (let f = 1; f <= 5; f++) {
          const fy = gy + (f * gh) / 5;
          ctx.beginPath();
          ctx.moveTo(gx, fy);
          ctx.lineTo(gx + gw, fy);
          ctx.stroke();
        }

        // Strings
        for (let s = 0; s < 6; s++) {
          const sx = gx + (s * gw) / 5;
          ctx.beginPath();
          ctx.moveTo(sx, gy);
          ctx.lineTo(sx, gy + gh);
          ctx.stroke();

          // Dots on frets
          const fretVal = step.guitarDiagram.frets[s];
          if (typeof fretVal === 'number' && fretVal > 0) {
            const relFret = fretVal - (step.guitarDiagram.baseFret ?? 1) + 1;
            if (relFret >= 1 && relFret <= 5) {
              const dotY = gy + ((relFret - 0.5) * gh) / 5;
              ctx.save();
              ctx.fillStyle = mainColor;
              ctx.beginPath();
              ctx.arc(sx, dotY, 11, 0, Math.PI * 2);
              ctx.fill();
              ctx.restore();
            }
          }

          // Top markers
          if (fretVal === 'x') {
            ctx.save();
            ctx.strokeStyle = mutedColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(sx - 8, gy - 20);
            ctx.lineTo(sx + 8, gy - 6);
            ctx.moveTo(sx + 8, gy - 20);
            ctx.lineTo(sx - 8, gy - 6);
            ctx.stroke();
            ctx.restore();
          }

          // Bottom note letters
          const noteLabel = step.guitarDiagram.stringNotes[s] ?? '';
          ctx.font = '600 22px Inter, monospace';
          ctx.fillStyle = fretVal === 'x' ? mutedColor : mainColor;
          ctx.textAlign = 'center';
          ctx.fillText(noteLabel, sx, gy + gh + 34);
        }

        // Right Column: Swan Glide branding
        const bx = 620;
        const by = bottomY + 60;
        ctx.textAlign = 'left';
        ctx.font = '400 26px Inter, sans-serif';
        ctx.fillStyle = isDark ? '#A1A1AA' : 'rgba(46, 16, 77, 0.7)';
        ctx.fillText('Made with', bx, by);

        ctx.font = '900 48px Inter, sans-serif';
        ctx.fillStyle = mainColor;
        ctx.fillText('Swan Glide', bx, by + 56);

        ctx.font = '500 28px Inter, sans-serif';
        ctx.fillStyle = isDark ? '#D4D4D8' : 'rgba(46, 16, 77, 0.8)';
        ctx.fillText('by Swanek Audio', bx, by + 104);

        ctx.font = '400 24px Inter, sans-serif';
        ctx.fillStyle = mutedColor;
        ctx.fillText('(Link In Bio)', bx, by + 144);
        ctx.restore();

        // Loop condition
        if (elapsed < totalDurationSeconds) {
          animationFrameRef.current = requestAnimationFrame(drawFrame);
        } else {
          // Finished recording
          bufferSource.stop();
          recorder.stop();
        }
      };

      recorder.onstop = () => {
        const videoBlob = new Blob(recordedChunks, { type: mimeType });
        const url = URL.createObjectURL(videoBlob);
        setDownloadUrl(url);
        setIsRecording(false);
        setProgressPercent(100);

        // Auto trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `swan_glide_short_${Date.now()}.webm`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      };

      animationFrameRef.current = requestAnimationFrame(drawFrame);
    } catch (err) {
      console.error('Failed to export video:', err);
      setIsRecording(false);
    }
  }, [audioElement, isDark, isRecording, progression]);

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
          download="swan_glide_short.webm"
          className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-emerald-600 text-white font-medium text-xs shadow-md hover:bg-emerald-500 transition-colors"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save Video</span>
        </a>
      )}
    </div>
  );
};
