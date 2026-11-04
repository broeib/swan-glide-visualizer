import { AudioBufferLike } from './types';

/**
 * Encodes audio buffer channel data into standard PCM WAV binary format.
 *
 * Conforms to RIFF/WAVE specifications:
 * - Supports 16-bit or 24-bit integer PCM encoding
 * - Supports mono or stereo interleaved channel layouts
 * - Soft-clamps audio float samples [-1.0, 1.0] to prevent digital clipping wrap-around
 *
 * @param buffer Audio buffer source containing channel Float32Arrays.
 * @param bitDepth Target PCM bit depth (16 or 24 bits per sample, default: 16).
 * @returns Uint8Array containing complete WAV binary file.
 */
export function encodeWav(
  buffer: AudioBufferLike,
  bitDepth: 16 | 24 = 16,
): Uint8Array {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const numSamples = buffer.length;

  const bytesPerSample = bitDepth === 24 ? 3 : 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = numSamples * blockAlign;
  const headerSize = 44;
  const totalFileSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalFileSize);
  const view = new DataView(arrayBuffer);

  // Helper writing 4-character ASCII strings into DataView
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // 1. "RIFF" chunk descriptor
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true); // Chunk size
  writeString(8, 'WAVE');

  // 2. "fmt " sub-chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // Subchunk1 size (16 for PCM)
  view.setUint16(20, 1, true); // Audio format (1 = PCM)
  view.setUint16(22, numChannels, true); // Number of channels
  view.setUint32(24, sampleRate, true); // Sample rate (e.g. 48000)
  view.setUint32(28, byteRate, true); // Byte rate
  view.setUint16(32, blockAlign, true); // Block align
  view.setUint16(34, bitDepth, true); // Bits per sample

  // 3. "data" sub-chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true); // Data size

  // Retrieve channel Float32Arrays
  const channels: Float32Array[] = [];
  for (let ch = 0; ch < numChannels; ch++) {
    channels.push(buffer.getChannelData(ch));
  }

  let offset = 44;

  if (bitDepth === 16) {
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = channels[ch];
        const sample = channelData ? channelData[i] ?? 0 : 0;
        // Soft clipping clamp [-1.0, 1.0]
        const clamped = Math.max(-1.0, Math.min(1.0, sample));
        // Scale to 16-bit signed integer
        const intVal =
          clamped < 0 ? Math.round(clamped * 32768) : Math.round(clamped * 32767);
        view.setInt16(offset, intVal, true);
        offset += 2;
      }
    }
  } else {
    // 24-bit PCM
    for (let i = 0; i < numSamples; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = channels[ch];
        const sample = channelData ? channelData[i] ?? 0 : 0;
        const clamped = Math.max(-1.0, Math.min(1.0, sample));
        const intVal =
          clamped < 0
            ? Math.round(clamped * 8388608)
            : Math.round(clamped * 8388607);

        // Little-endian 3-byte packing
        view.setUint8(offset, intVal & 0xff);
        view.setUint8(offset + 1, (intVal >> 8) & 0xff);
        view.setUint8(offset + 2, (intVal >> 16) & 0xff);
        offset += 3;
      }
    }
  }

  return new Uint8Array(arrayBuffer);
}

/**
 * Writes rendered WAV binary data directly to the local filesystem.
 *
 * Dynamically utilizes Node.js fs/promises when running in Node/CLI environments.
 * When called in browser contexts, triggers an automatic browser file download.
 *
 * @param wavData Binary WAV byte array.
 * @param filePath Output file destination path.
 */
export async function writeWavToFile(
  wavData: Uint8Array,
  filePath: string,
): Promise<void> {
  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    const fs = await import('fs/promises');
    const path = await import('path');
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(filePath, wavData);
    return;
  }

  if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const blob = new Blob([wavData.buffer as ArrayBuffer], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const filename = filePath.split('/').pop() ?? 'audio.wav';
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    return;
  }

  throw new Error('Unsupported runtime environment for file writing');
}
