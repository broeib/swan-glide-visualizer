import fs from 'fs';
import path from 'path';
import { ChordStep } from '../types/music';

/**
 * Metadata for a generated social publishing bundle.
 */
export interface SocialBundleMetadata {
  title: string;
  mood: string;
  key: string;
  bpm: number;
  steps: ChordStep[];
  description?: string;
  instrument?: string;
  theme?: string;
}

/**
 * Creative title dictionary mapped by mood archetype.
 */
const CREATIVE_TITLES: Record<string, string[]> = {
  'dreamy-major': [
    'Velvet Horizon',
    'Lydian Shimmer',
    'Celestial Drift',
    'Golden Hour Glow',
    'Sunlit Waves',
    'Morning Silk'
  ],
  'melancholy-minor': [
    'Autumn Raindrops',
    'Shadows in Db',
    'Midnight Reverie',
    'Distant Blue',
    'Quiet Solitude',
    'Paper Lanterns'
  ],
  'spicy-altered': [
    'Tritone Whispers',
    'Altered Smoke',
    'Neon Midnight',
    'Chromatic Glide',
    'Spicy Diminished',
    'After Hours Jazz'
  ],
  'smooth-rnb': [
    'Silk & Honey',
    'Warm Rhodes Breeze',
    'Late Night Call',
    'Slow Motion Love',
    'Sunday Sunset',
    'Smooth Glide'
  ]
};

/**
 * Returns a creative track title based on mood archetype and key center.
 */
export function generateTrackTitle(mood: string, key: string): string {
  const titles = CREATIVE_TITLES[mood] || CREATIVE_TITLES['dreamy-major']!;
  const selected = titles[Math.floor(Math.random() * titles.length)]!;
  return `${selected} (in ${key})`;
}

/**
 * Analyzes voice-leading intervals between chord steps to generate an insightful summary.
 */
export function analyzeVoiceLeading(steps: ChordStep[]): string {
  if (steps.length < 2) {
    return 'Lush static voicing with rich harmonic extensions.';
  }

  let totalSemitoneDelta = 0;
  let voiceCount = 0;

  for (let i = 0; i < steps.length - 1; i++) {
    const s1 = steps[i]!;
    const s2 = steps[i + 1]!;
    const minVoices = Math.min(s1.voices.length, s2.voices.length);

    for (let v = 1; v < minVoices; v++) {
      // Exclude bass for upper voice leading analysis
      const diff = Math.abs(s2.voices[v]!.midi - s1.voices[v]!.midi);
      totalSemitoneDelta += diff;
      voiceCount++;
    }
  }

  const avgMovement = voiceCount > 0 ? (totalSemitoneDelta / voiceCount).toFixed(1) : '1.2';

  return `Minimal displacement voice-leading averaging ${avgMovement} semitones per voice. ` +
    'Upper soprano maintains a lyrical melodic contour while inner tenor voices hold guide-tone anchors.';
}

/**
 * Generates formatted, ready-to-publish social caption text.
 */
export function generateCaptionText(metadata: SocialBundleMetadata): string {
  const moodFormatted = metadata.mood
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

  // Chord progression steps breakdown
  const chordsBreakdown = metadata.steps
    .map((step, idx) => `  ${idx + 1}. ${step.chordName}`)
    .join('\n');

  const voiceSummary = analyzeVoiceLeading(metadata.steps);

  return [
    `🎵 ${metadata.title}`,
    `Mood: ${moodFormatted} | Key: ${metadata.key} | Tempo: ${metadata.bpm} BPM`,
    '',
    'Harmonic Progression Breakdown:',
    chordsBreakdown,
    '',
    'Voice-Leading Analysis:',
    voiceSummary,
    '',
    metadata.description ? `About this progression:\n${metadata.description}\n` : '',
    'Rendered with Swan Glide Visualizer 🕊️✨',
    '',
    '#neosoul #chords #jazzharmony #pianochords #guitarchords #musictheory #swanglide #ultravioletchorus'
  ].filter((line) => line !== null && line !== undefined).join('\n');
}

/**
 * Creates date-stamped output bundle folder conforming to requirements:
 * output/YYYY-MM-DD/song_<timestamp>_<archetype>/
 */
export function createBundleDirectory(
  baseOutputDir: string = 'output',
  archetype: string = 'dreamy-major'
): { folderPath: string; folderName: string; dateFolder: string } {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const dateFolder = `${year}-${month}-${day}`;

  const timestamp = Math.floor(now.getTime() / 1000);
  const cleanArchetype = archetype.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  const folderName = `song_${timestamp}_${cleanArchetype}`;

  const fullPath = path.resolve(baseOutputDir, dateFolder, folderName);
  fs.mkdirSync(fullPath, { recursive: true });

  return {
    folderPath: fullPath,
    folderName,
    dateFolder
  };
}

/**
 * Writes the complete social publishing bundle files into the destination folder.
 */
export function writePublishingBundle(
  folderPath: string,
  videoBufferOrPath: string | Buffer,
  coverBufferOrPath: string | Buffer,
  metadata: SocialBundleMetadata
): {
  videoPath: string;
  coverPath: string;
  captionPath: string;
  manifestPath: string;
} {
  fs.mkdirSync(folderPath, { recursive: true });

  // 1. video.mp4
  const videoPath = path.join(folderPath, 'video.mp4');
  if (typeof videoBufferOrPath === 'string') {
    if (videoBufferOrPath !== videoPath) {
      fs.copyFileSync(videoBufferOrPath, videoPath);
    }
  } else {
    fs.writeFileSync(videoPath, videoBufferOrPath);
  }

  // 2. cover.jpg
  const coverPath = path.join(folderPath, 'cover.jpg');
  if (typeof coverBufferOrPath === 'string') {
    if (coverBufferOrPath !== coverPath) {
      fs.copyFileSync(coverBufferOrPath, coverPath);
    }
  } else {
    fs.writeFileSync(coverPath, coverBufferOrPath);
  }

  // 3. caption.txt
  const captionPath = path.join(folderPath, 'caption.txt');
  const captionText = generateCaptionText(metadata);
  fs.writeFileSync(captionPath, captionText, 'utf8');

  // 4. manifest.json (Social Manifest)
  const manifestPath = path.join(folderPath, 'manifest.json');
  const manifestData = {
    title: metadata.title,
    mood: metadata.mood,
    key: metadata.key,
    bpm: metadata.bpm,
    instrument: metadata.instrument || 'guitar',
    theme: metadata.theme || 'pastel',
    chordNames: metadata.steps.map((s) => s.chordName),
    totalBeats: metadata.steps.reduce((sum, s) => sum + s.durationBeats, 0),
    videoFile: 'video.mp4',
    coverFile: 'cover.jpg',
    captionFile: 'caption.txt',
    createdAt: new Date().toISOString()
  };
  fs.writeFileSync(manifestPath, JSON.stringify(manifestData, null, 2), 'utf8');

  return {
    videoPath,
    coverPath,
    captionPath,
    manifestPath
  };
}