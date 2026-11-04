import path from 'path';
import { generateProgression } from '../engine/harmony/generator';
import { MoodArchetype } from '../engine/harmony/types';
import { THEME_PRESETS_LIST } from '../engine/themes/themePresets';
import {
  createBundleDirectory,
  generateTrackTitle,
  writePublishingBundle,
  SocialBundleMetadata
} from './socialBundler';
import { renderVideo } from './videoMuxer';

/**
 * CLI and programmatic options for batch pipeline generation.
 */
export interface PipelineRunOptions {
  /** Number of songs to generate and render (default: 3). */
  count?: number;
  /** Mood archetype filter ('dreamy-major', 'melancholy-minor', 'spicy-altered', 'smooth-rnb', or 'random'). */
  mood?: string;
  /** Instrument visualization ('guitar', 'piano', or 'random'). */
  instrument?: string;
  /** Theme preset ('pastel', 'dark', 'sunset', 'lofi', 'cream', or 'random'). */
  theme?: string;
  /** Root output directory (default: 'output'). */
  outputDir?: string;
  /** Optional beat limit for fast test rendering (e.g. 8 to 16 beats). */
  durationBeats?: number;
  /** Custom artist social handle. */
  artistHandle?: string;
  /** Verbose console logging flag. */
  verbose?: boolean;
}

const SUPPORTED_MOODS: readonly MoodArchetype[] = [
  'dreamy-major',
  'melancholy-minor',
  'spicy-altered',
  'smooth-rnb'
];

const SUPPORTED_INSTRUMENTS = ['guitar', 'piano'] as const;

/**
 * Resolves or randomly selects a mood archetype.
 */
function resolveMood(requestedMood?: string): MoodArchetype {
  if (requestedMood && requestedMood !== 'random') {
    const clean = requestedMood.toLowerCase().trim();
    if (SUPPORTED_MOODS.includes(clean as MoodArchetype)) {
      return clean as MoodArchetype;
    }
  }
  return SUPPORTED_MOODS[Math.floor(Math.random() * SUPPORTED_MOODS.length)]!;
}

/**
 * Resolves or randomly selects an instrument.
 */
function resolveInstrument(requestedInstrument?: string): 'guitar' | 'piano' {
  if (requestedInstrument && requestedInstrument !== 'random') {
    const clean = requestedInstrument.toLowerCase().trim();
    if (clean === 'guitar' || clean === 'piano') {
      return clean;
    }
  }
  return SUPPORTED_INSTRUMENTS[Math.floor(Math.random() * SUPPORTED_INSTRUMENTS.length)]!;
}

/**
 * Resolves or randomly selects a theme preset.
 */
function resolveTheme(requestedTheme?: string): string {
  if (requestedTheme && requestedTheme !== 'random') {
    const clean = requestedTheme.toLowerCase().trim();
    const match = THEME_PRESETS_LIST.find((t) => t.id === clean);
    if (match) {
      return match.id;
    }
  }
  const randomPreset = THEME_PRESETS_LIST[Math.floor(Math.random() * THEME_PRESETS_LIST.length)]!;
  return randomPreset.id;
}

/**
 * Executes batch pipeline generation producing ready-to-publish social bundles.
 */
export async function runPipeline(options: PipelineRunOptions = {}): Promise<{
  success: boolean;
  bundles: Array<{
    folderPath: string;
    videoPath: string;
    coverPath: string;
    captionPath: string;
    title: string;
  }>;
}> {
  const count = options.count ?? 3;
  const outputDir = options.outputDir ?? 'output';
  const durationBeats = options.durationBeats;
  const verbose = options.verbose ?? true;

  if (verbose) {
    console.log('====================================================');
    console.log('🕊️  Swan Glide Video Pipeline: Starting Batch Run');
    console.log(`   Count: ${count}`);
    console.log(`   Requested Mood: ${options.mood || 'random'}`);
    console.log(`   Requested Instrument: ${options.instrument || 'random'}`);
    console.log(`   Requested Theme: ${options.theme || 'random'}`);
    console.log(`   Output Directory: ${outputDir}`);
    if (durationBeats) {
      console.log(`   Duration Limit: ${durationBeats} beats (Test Mode)`);
    }
    console.log('====================================================\n');
  }

  const generatedBundles = [];

  for (let i = 0; i < count; i++) {
    const songIndex = i + 1;
    const mood = resolveMood(options.mood);
    const instrument = resolveInstrument(options.instrument);
    const theme = resolveTheme(options.theme);

    if (verbose) {
      console.log(`[${songIndex}/${count}] Generating procedural harmony...`);
      console.log(`      Archetype: ${mood}`);
      console.log(`      Instrument: ${instrument}`);
      console.log(`      Theme: ${theme}`);
    }

    // 1. Procedural harmony generation
    const timeline = generateProgression({ mood });
    const title = generateTrackTitle(mood, timeline.metadata.key);

    if (verbose) {
      console.log(`      Title: "${title}"`);
      console.log(`      Key: ${timeline.metadata.key} | BPM: ${timeline.bpm}`);
      console.log(`      Chords: ${timeline.metadata.chordNames.join(' -> ')}`);
    }

    // 2. Prepare publishing bundle directory
    const { folderPath } = createBundleDirectory(outputDir, mood);
    const videoDestPath = path.join(folderPath, 'video.mp4');
    const coverDestPath = path.join(folderPath, 'cover.jpg');

    if (verbose) {
      console.log(`      Rendering video to ${folderPath}...`);
    }

    // 3. Render 1080x1920 60FPS video and capture cover snapshot
    await renderVideo({
      progression: timeline,
      instrument,
      theme,
      outputVideoPath: videoDestPath,
      outputCoverPath: coverDestPath,
      renderBeats: durationBeats,
      artistHandle: options.artistHandle || '@ultravioletchorus',
      onProgress: verbose
        ? (frame, totalFrames, percent) => {
            if (frame % 30 === 0 || frame === totalFrames) {
              process.stdout.write(`\r      Progress: ${percent}% (${frame}/${totalFrames} frames)`);
            }
          }
        : undefined
    });

    if (verbose) {
      process.stdout.write('\n');
      console.log('      Video and cover snapshot rendered successfully.');
    }

    // 4. Write Social Caption and Manifest
    const metadata: SocialBundleMetadata = {
      title,
      mood,
      key: timeline.metadata.key,
      bpm: timeline.bpm,
      steps: timeline.steps,
      description: timeline.metadata.description,
      instrument,
      theme
    };

    const bundleFiles = writePublishingBundle(
      folderPath,
      videoDestPath,
      coverDestPath,
      metadata
    );

    if (verbose) {
      console.log(`      Bundle created at: ${folderPath}`);
      console.log(`      - Video: ${bundleFiles.videoPath}`);
      console.log(`      - Cover: ${bundleFiles.coverPath}`);
      console.log(`      - Caption: ${bundleFiles.captionPath}\n`);
    }

    generatedBundles.push({
      folderPath,
      videoPath: bundleFiles.videoPath,
      coverPath: bundleFiles.coverPath,
      captionPath: bundleFiles.captionPath,
      title
    });
  }

  if (verbose) {
    console.log('====================================================');
    console.log(`✨ Batch complete! ${generatedBundles.length} publishing bundles generated.`);
    console.log('====================================================\n');
  }

  return {
    success: true,
    bundles: generatedBundles
  };
}