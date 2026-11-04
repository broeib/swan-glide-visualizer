import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer, { Browser, Page } from 'puppeteer';
import { ProgressionTimeline } from '../types/music';
import { generate48kHzAudio } from './audioSynth';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Options for rendering and muxing a visualizer video.
 */
export interface VideoRenderOptions {
  /** Target progression timeline model. */
  progression: ProgressionTimeline;
  /** Active instrument visualization ('guitar' or 'piano'). */
  instrument?: 'guitar' | 'piano';
  /** Active theme preset ('pastel', 'dark', 'sunset', 'lofi', 'cream'). */
  theme?: string;
  /** Destination path for the encoded MP4 file. */
  outputVideoPath: string;
  /** Destination path for the cover thumbnail snapshot. */
  outputCoverPath: string;
  /** Artist social handle for watermark attribution. */
  artistHandle?: string;
  /** Total beats to render. Defaults to progression.getTotalBeats(). */
  renderBeats?: number;
  /** Target frame rate in FPS (default: 60). */
  fps?: number;
  /** Progress callback emitting (currentFrame, totalFrames, percent). */
  onProgress?: (frame: number, totalFrames: number, percent: number) => void;
}

/**
 * Ensures system library paths include required shared objects on Linux.
 */
export function configureSystemEnvironment(): void {
  const currentLd = process.env.LD_LIBRARY_PATH || '';
  if (!currentLd.includes('/usr/lib/firefox-esr')) {
    process.env.LD_LIBRARY_PATH = `/usr/lib/firefox-esr:${currentLd}`;
  }
}

/**
 * Launches headless Chromium with required flags for headless Linux environments.
 */
export async function launchHeadlessBrowser(): Promise<Browser> {
  configureSystemEnvironment();

  return await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--allow-file-access-from-files',
      '--mute-audio'
    ]
  });
}

/**
 * Locates the local render.html entry point.
 */
export function getRenderHtmlPath(): string {
  const candidates = [
    path.resolve(process.cwd(), 'src/pipeline/render.html'),
    path.resolve(process.cwd(), 'render.html'),
    path.resolve(__dirname, 'render.html'),
    path.resolve(__dirname, '../pipeline/render.html')
  ];

  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error('Could not locate render.html in src/pipeline or project root');
}

/**
 * Renders the visualizer into a pristine 1080x1920 60FPS MP4 video muxed with 48kHz audio.
 */
export async function renderVideo(options: VideoRenderOptions): Promise<{
  videoPath: string;
  coverPath: string;
  totalFrames: number;
  durationSeconds: number;
}> {
  const fps = options.fps ?? 60;
  const progression = options.progression;
  const bpm = progression.bpm || 60;

  const totalProgBeats = progression.getTotalBeats();
  const renderBeats = options.renderBeats && options.renderBeats > 0
    ? Math.min(options.renderBeats, totalProgBeats)
    : totalProgBeats;

  const durationSeconds = (renderBeats / bpm) * 60;
  const totalFrames = Math.ceil(durationSeconds * fps);

  // Temporary audio file path
  const tempAudioPath = path.resolve(
    path.dirname(options.outputVideoPath),
    `temp_audio_${Date.now()}.wav`
  );

  let browser: Browser | null = null;

  try {
    browser = await launchHeadlessBrowser();
    const page: Page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });

    const htmlPath = 'file://' + getRenderHtmlPath();
    await page.goto(htmlPath, { waitUntil: 'load' });

    // Load progression into page
    await page.evaluate(
      (progData, renderOpts) => {
        (window as any).loadProgression(progData, {
          instrument: renderOpts.instrument || 'guitar',
          theme: renderOpts.theme || 'pastel',
          bpm: renderOpts.bpm,
          artistHandle: renderOpts.artistHandle || '@ultravioletchorus'
        });
      },
      JSON.parse(JSON.stringify({ steps: progression.steps, bpm })),
      {
        instrument: options.instrument,
        theme: options.theme,
        bpm,
        artistHandle: options.artistHandle
      }
    );

    // 1. Generate 48kHz audio track
    await generate48kHzAudio(page, progression, tempAudioPath, 48000);

    // 2. Capture high-resolution cover snapshot at beat 2 (or beat 4)
    // Beat 2 or 4 represents a dynamic harmonic resolution with glowing ribbons
    const coverBeat = Math.min(2.0, renderBeats * 0.25);
    const coverTimeSeconds = (coverBeat / bpm) * 60;
    const coverDataUrl = await page.evaluate(
      (t: number) => (window as any).renderFrame(t),
      coverTimeSeconds
    );
    const coverBase64 = coverDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
    fs.mkdirSync(path.dirname(options.outputCoverPath), { recursive: true });
    fs.writeFileSync(options.outputCoverPath, Buffer.from(coverBase64, 'base64'));

    // 3. Spawn FFmpeg video encoder and audio muxer
    fs.mkdirSync(path.dirname(options.outputVideoPath), { recursive: true });

    const ffmpegArgs = [
      '-y',
      '-f', 'image2pipe',
      '-framerate', String(fps),
      '-c:v', 'mjpeg',
      '-i', '-',
      '-i', tempAudioPath,
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '18',
      '-pix_fmt', 'yuv420p',
      '-c:a', 'aac',
      '-b:a', '320k',
      '-shortest',
      options.outputVideoPath
    ];

    const ffmpeg: ChildProcessWithoutNullStreams = spawn('ffmpeg', ffmpegArgs);

    let ffmpegErrorOutput = '';
    ffmpeg.stderr.on('data', (chunk) => {
      ffmpegErrorOutput += chunk.toString();
    });

    const ffmpegClosePromise = new Promise<void>((resolve, reject) => {
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`FFmpeg exited with code ${code}: ${ffmpegErrorOutput.slice(-300)}`));
        }
      });
      ffmpeg.on('error', (err) => {
        reject(err);
      });
    });

    // 4. Deterministic Frame Stepping Loop
    // Captures each frame sequentially and pipes to FFmpeg stdin
    for (let frame = 0; frame < totalFrames; frame++) {
      const timeInSeconds = frame / fps;

      const frameDataUrl: string = await page.evaluate(
        (t: number) => (window as any).renderFrame(t),
        timeInSeconds
      );

      const base64Data = frameDataUrl.replace(/^data:image\/[a-z]+;base64,/, '');
      const frameBuffer = Buffer.from(base64Data, 'base64');

      const canWrite = ffmpeg.stdin.write(frameBuffer);
      if (!canWrite) {
        // Handle backpressure
        await new Promise((r) => ffmpeg.stdin.once('drain', r));
      }

      if (options.onProgress) {
        const percent = Math.round(((frame + 1) / totalFrames) * 100);
        options.onProgress(frame + 1, totalFrames, percent);
      }
    }

    // End stdin pipe to complete FFmpeg encoding
    ffmpeg.stdin.end();
    await ffmpegClosePromise;

    return {
      videoPath: options.outputVideoPath,
      coverPath: options.outputCoverPath,
      totalFrames,
      durationSeconds
    };
  } finally {
    // Clean up temporary audio file
    if (fs.existsSync(tempAudioPath)) {
      try {
        fs.unlinkSync(tempAudioPath);
      } catch {
        // Ignore temporary file deletion errors
      }
    }

    // Close headless browser
    if (browser) {
      await browser.close();
    }
  }
}