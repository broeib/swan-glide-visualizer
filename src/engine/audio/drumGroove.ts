import { DrumHit, DrumVoice } from './types';

/**
 * Calculates swung beat offset for off-beat subdivisions.
 *
 * Straight 8th notes sit at offset 0.50. Neo-soul pocket swing places
 * the off-beat between 0.56 and 0.62, imparting a relaxed, human groove.
 *
 * @param baseBeat Integer beat within the measure (0, 1, 2, 3).
 * @param subdivision 0 for downbeat, 0.5 for 8th note, 0.75 for 16th note.
 * @param swingFactor Swing ratio (0.50 is straight, 0.58 is default pocket swing).
 */
export function calculateSwungBeat(
  baseBeat: number,
  subdivision: number,
  swingFactor: number = 0.58,
): number {
  if (subdivision === 0) {
    return baseBeat;
  }

  // 8th note off-beat
  if (Math.abs(subdivision - 0.5) < 0.01) {
    const swingDelta = swingFactor - 0.5;
    return baseBeat + 0.5 + swingDelta;
  }

  // 16th note swung push (e.g. 0.75 subdivision)
  if (Math.abs(subdivision - 0.75) < 0.01) {
    const swingDelta = (swingFactor - 0.5) * 0.8;
    return baseBeat + 0.75 + swingDelta;
  }

  // 16th note swung second subdivision (e.g. 0.25 subdivision)
  if (Math.abs(subdivision - 0.25) < 0.01) {
    const swingDelta = (swingFactor - 0.5) * 0.4;
    return baseBeat + 0.25 + swingDelta;
  }

  return baseBeat + subdivision;
}

/**
 * Procedurally generates a complete neo-soul swung drum groove across a progression timeline.
 *
 * Features:
 * - Swung membrane kick with low-frequency pitch drop and warm body
 * - Soft rimshot/snare with pink noise burst and room acoustic decay
 * - Dynamic hi-hat patterns with relaxed neo-soul pocket swing
 * - Zero external samples or asset dependencies
 *
 * @param totalBeats Total duration of progression in musical beats.
 * @param bpm Progression tempo in beats per minute (supports 60 to 80 BPM).
 * @param swing Swing factor between 0.50 (straight) and 0.65 (heavy swing).
 * @returns Array of scheduled DrumHit events.
 */
export function generateNeoSoulDrumGroove(
  totalBeats: number,
  bpm: number,
  swing: number = 0.58,
): DrumHit[] {
  const hits: DrumHit[] = [];
  const secondsPerBeat = 60 / bpm;

  const pushHit = (beat: number, voice: DrumVoice, velocity: number) => {
    if (beat >= totalBeats) {
      return;
    }
    hits.push({
      beat,
      timeSeconds: beat * secondsPerBeat,
      voice,
      velocity: Math.max(0.1, Math.min(1.0, velocity)),
    });
  };

  const measureCount = Math.ceil(totalBeats / 4);

  for (let m = 0; m < measureCount; m++) {
    const measureStartBeat = m * 4;

    // Beat 1 (bar beat 0)
    // Heavy foundational kick and accent hi-hat
    pushHit(measureStartBeat + 0, 'kick', 0.88);
    pushHit(measureStartBeat + 0, 'hihatClosed', 0.62);

    // Beat 1 off-beat (8th note)
    const b0_5 = calculateSwungBeat(measureStartBeat + 0, 0.5, swing);
    pushHit(b0_5, 'hihatClosed', 0.34);

    // Beat 2 (bar beat 1)
    // Soft rimshot / snare backbeat and steady hi-hat
    pushHit(measureStartBeat + 1, 'snare', 0.76);
    pushHit(measureStartBeat + 1, 'hihatClosed', 0.48);

    // Beat 2 off-beat (8th note)
    const b1_5 = calculateSwungBeat(measureStartBeat + 1, 0.5, swing);
    pushHit(b1_5, 'hihatClosed', 0.36);

    // Pocket kick: classic Dilla delayed syncopation right before beat 3
    const b1_75 = calculateSwungBeat(measureStartBeat + 1, 0.75, swing);
    pushHit(b1_75, 'kick', 0.54);

    // Beat 3 (bar beat 2)
    // Second kick downbeat and hi-hat
    pushHit(measureStartBeat + 2, 'kick', 0.72);
    pushHit(measureStartBeat + 2, 'hihatClosed', 0.52);

    // Beat 3 off-beat (8th note)
    // Open hi-hat accent creating dynamic breathing space
    const b2_5 = calculateSwungBeat(measureStartBeat + 2, 0.5, swing);
    pushHit(b2_5, 'hihatOpen', 0.46);

    // Beat 4 (bar beat 3)
    // Strong rimshot / snare backbeat and hi-hat
    pushHit(measureStartBeat + 3, 'snare', 0.82);
    pushHit(measureStartBeat + 3, 'hihatClosed', 0.50);

    // Beat 4 off-beat (8th note)
    const b3_5 = calculateSwungBeat(measureStartBeat + 3, 0.5, swing);
    pushHit(b3_5, 'hihatClosed', 0.38);

    // Optional subtle turnaround ghost kick on the final 16th before next bar
    if (m % 2 === 1) {
      const b3_75 = calculateSwungBeat(measureStartBeat + 3, 0.75, swing);
      pushHit(b3_75, 'kick', 0.42);
    }
  }

  // Sort chronologically
  hits.sort((a, b) => a.timeSeconds - b.timeSeconds);
  return hits;
}
