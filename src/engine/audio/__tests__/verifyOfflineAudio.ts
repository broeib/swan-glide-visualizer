import * as fs from 'fs';
import * as path from 'path';
import { mockProgression } from '../../../data/mockProgression';
import {
  exportProgressionWavFile,
  renderProgressionAudioOffline,
} from '../offlineAudioRenderer';

/**
 * Verification test suite for Headless Offline Audio Synthesis.
 *
 * Verifies:
 * 1. 24-second progression renders in under 3.0 seconds faster than real time.
 * 2. Binary WAV output contains standard RIFF / WAVE / fmt headers.
 * 3. 48kHz stereo 16-bit PCM parameters match exact specifications.
 * 4. Multi-track arrangements (Rhodes, Sub-bass, Drums, Vinyl) synthesize cleanly.
 * 5. WAV file export writes valid playable file to disk.
 */
async function runOfflineAudioVerification(): Promise<void> {
  console.log('=== Starting Offline Audio Synthesis Verification ===\n');

  const totalBeats = mockProgression.getTotalBeats();
  const bpm = mockProgression.bpm;
  const progressionDurationSec = mockProgression.getTotalDurationSeconds();

  console.log(`Timeline: ${totalBeats} beats at ${bpm} BPM (${progressionDurationSec} seconds)`);
  console.log(`Steps count: ${mockProgression.steps.length} chord steps\n`);

  // Test 1: Full multi-track render benchmark (< 3 seconds)
  console.log('Test 1: Full multi-track render performance benchmark...');
  const t0 = performance.now();
  const wavBytes = await renderProgressionAudioOffline(mockProgression, {
    sampleRate: 48000,
    bitDepth: 16,
    tailSeconds: 1.5,
    arrangement: {
      rhodes: true,
      bass: true,
      drums: true,
      vinyl: true,
    },
  });
  const t1 = performance.now();
  const renderTimeSec = (t1 - t0) / 1000;

  console.log(`Render completed in: ${renderTimeSec.toFixed(3)}s (${t1 - t0} ms)`);
  console.log(`Audio duration rendered: ${progressionDurationSec + 1.5}s`);
  console.log(`WAV file size: ${wavBytes.byteLength} bytes (${(wavBytes.byteLength / 1024 / 1024).toFixed(2)} MB)`);

  if (renderTimeSec >= 3.0) {
    throw new Error(
      `FAILURE: Render time ${renderTimeSec.toFixed(3)}s exceeded the 3.0-second limit!`,
    );
  }
  console.log('PASSED: Completed in < 3.0 seconds faster than real time.\n');

  // Test 2: WAV Header validation
  console.log('Test 2: Standard WAV header format validation...');
  const view = new DataView(
    wavBytes.buffer,
    wavBytes.byteOffset,
    wavBytes.byteLength,
  );

  const riff = String.fromCharCode(
    wavBytes[0] ?? 0,
    wavBytes[1] ?? 0,
    wavBytes[2] ?? 0,
    wavBytes[3] ?? 0,
  );
  const wave = String.fromCharCode(
    wavBytes[8] ?? 0,
    wavBytes[9] ?? 0,
    wavBytes[10] ?? 0,
    wavBytes[11] ?? 0,
  );
  const fmt = String.fromCharCode(
    wavBytes[12] ?? 0,
    wavBytes[13] ?? 0,
    wavBytes[14] ?? 0,
    wavBytes[15] ?? 0,
  );
  const audioFormat = view.getUint16(20, true);
  const numChannels = view.getUint16(22, true);
  const sampleRate = view.getUint32(24, true);
  const bitsPerSample = view.getUint16(34, true);
  const dataHeader = String.fromCharCode(
    wavBytes[36] ?? 0,
    wavBytes[37] ?? 0,
    wavBytes[38] ?? 0,
    wavBytes[39] ?? 0,
  );
  const dataSize = view.getUint32(40, true);

  console.log(`RIFF chunk: "${riff}"`);
  console.log(`WAVE identifier: "${wave}"`);
  console.log(`Format sub-chunk: "${fmt}"`);
  console.log(`Audio format: ${audioFormat} (1 = PCM)`);
  console.log(`Channels: ${numChannels} (2 = Stereo)`);
  console.log(`Sample rate: ${sampleRate} Hz`);
  console.log(`Bit depth: ${bitsPerSample}-bit`);
  console.log(`Data chunk: "${dataHeader}" (size: ${dataSize} bytes)`);

  if (riff !== 'RIFF' || wave !== 'WAVE' || fmt !== 'fmt ' || dataHeader !== 'data') {
    throw new Error(
      `FAILURE: Invalid WAV header format! Got ${riff}/${wave}/${fmt}/${dataHeader}`,
    );
  }
  if (audioFormat !== 1 || numChannels !== 2 || sampleRate !== 48000 || bitsPerSample !== 16) {
    throw new Error(
      `FAILURE: WAV audio parameters do not match standard 48kHz stereo 16-bit PCM!`,
    );
  }
  console.log('PASSED: Valid standard 48kHz stereo 16-bit PCM WAV header.\n');

  // Test 3: Export to disk
  console.log('Test 3: File system export verification...');
  const outputDir = path.resolve(process.cwd(), 'output');
  const testWavPath = path.join(outputDir, 'test_progression_audio.wav');
  await exportProgressionWavFile(mockProgression, testWavPath, {
    arrangement: { rhodes: true, bass: true, drums: true, vinyl: true },
  });

  const fileExists = fs.existsSync(testWavPath);
  const stats = fileExists ? fs.statSync(testWavPath) : null;
  console.log(`Saved file: ${testWavPath}`);
  console.log(`File size on disk: ${stats?.size} bytes`);

  if (!fileExists || !stats || stats.size === 0) {
    throw new Error(`FAILURE: Exported WAV file is missing or empty!`);
  }
  console.log('PASSED: Exported WAV file written successfully.\n');

  // Test 4: Arrangement variations
  console.log('Test 4: Arrangement track variations verification...');

  const variations = [
    { name: 'Rhodes only', arrangement: { rhodes: true, bass: false, drums: false, vinyl: false } },
    { name: 'Rhodes + Bass', arrangement: { rhodes: true, bass: true, drums: false, vinyl: false } },
    { name: 'Full Trio (Rhodes + Bass + Drums)', arrangement: { rhodes: true, bass: true, drums: true, vinyl: false } },
  ];

  for (const v of variations) {
    const tStart = performance.now();
    const result = await renderProgressionAudioOffline(mockProgression, {
      arrangement: v.arrangement,
    });
    const tEnd = performance.now();
    console.log(`- ${v.name}: ${result.byteLength} bytes rendered in ${(tEnd - tStart).toFixed(1)} ms`);
    if (result.byteLength < 44) {
      throw new Error(`FAILURE: Result too small for variation ${v.name}`);
    }
  }
  console.log('PASSED: All arrangement combinations rendered cleanly.\n');

  console.log('=== All Audio Engine & Offline Synthesis Verifications Passed Successfully! ===');
}

runOfflineAudioVerification().catch((err) => {
  console.error('\nOffline Audio Verification failed with error:');
  console.error(err);
  process.exit(1);
});
