import { VOICE_PALETTE } from '../../../types/music';
import {
  AUTHENTIC_KEY_CENTERS,
  CHROMATIC_PITCH_CLASSES_FLAT,
  generateProgression,
  getArchetypeTemplates,
  getChordPitchClasses,
  midiToPitch,
  MoodArchetype,
  parseChordSymbol,
  PitchClass,
  pitchClassToSemitone,
  pitchToMidi,
  semitoneToPitchClass,
  solveGuitarChordVoicing,
  solveProgressionVoiceLeading,
} from '../index';

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, message: string): void {
  if (condition) {
    passedTests++;
    console.log(`  ✓ ${message}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

function runTests(): void {
  console.log('=== Procedural Harmony Engine Verification ===\n');

  // 1. Music Theory & Chords
  console.log('1. Music Theory & Chords:');
  const c4Midi = pitchToMidi('C4');
  assert(c4Midi === 60, `pitchToMidi("C4") is 60 (got ${c4Midi})`);

  const db2Midi = pitchToMidi('Db2');
  assert(db2Midi === 37, `pitchToMidi("Db2") is 37 (got ${db2Midi})`);

  const pitch60 = midiToPitch(60);
  assert(pitch60 === 'C4', `midiToPitch(60) is C4 (got ${pitch60})`);

  const pitch37 = midiToPitch(37);
  assert(pitch37 === 'Db2', `midiToPitch(37) is Db2 (got ${pitch37})`);

  // Enharmonics & All 12 pitch classes
  for (let s = 0; s < 12; s++) {
    const pcFlat = semitoneToPitchClass(s, false);
    const pcSharp = semitoneToPitchClass(s, true);
    assert(
      pitchClassToSemitone(pcFlat) === s,
      `Semitone ${s} maps to flat ${pcFlat} and back`,
    );
    assert(
      pitchClassToSemitone(pcSharp) === s,
      `Semitone ${s} maps to sharp ${pcSharp} and back`,
    );
  }

  // Chord parsing
  const parsedDbmaj9 = parseChordSymbol('Dbmaj9');
  assert(
    parsedDbmaj9.root === 'Db' &&
      parsedDbmaj9.rootLetter === 'D' &&
      parsedDbmaj9.accidental === 'b' &&
      parsedDbmaj9.extension === 'maj9',
    'parseChordSymbol("Dbmaj9") parses root, accidental, and extension',
  );

  const parsedC7s9 = parseChordSymbol('C7(#9)');
  assert(
    parsedC7s9.root === 'C' &&
      parsedC7s9.accidental === '' &&
      parsedC7s9.extension === '7(#9)',
    'parseChordSymbol("C7(#9)") parses correctly',
  );

  const dbmaj9Pcs = getChordPitchClasses('Db', 'maj9');
  assert(
    dbmaj9Pcs.includes(pitchClassToSemitone('Db')) &&
      dbmaj9Pcs.includes(pitchClassToSemitone('F')) &&
      dbmaj9Pcs.includes(pitchClassToSemitone('C')) &&
      dbmaj9Pcs.includes(pitchClassToSemitone('Eb')),
    'Dbmaj9 includes root (Db), 3rd (F), 7th (C), and 9th (Eb)',
  );

  // 2. Mood Archetypes & Cadence Matrix
  console.log('\n2. Mood Archetypes & Cadence Matrix:');
  const archetypes: MoodArchetype[] = [
    'dreamy-major',
    'melancholy-minor',
    'spicy-altered',
    'smooth-rnb',
  ];

  for (const mood of archetypes) {
    const templates = getArchetypeTemplates(mood);
    assert(
      templates.length >= 4,
      `Archetype "${mood}" has ${templates.length} templates (>= 4)`,
    );

    for (const tpl of templates) {
      const chordCount = tpl.chords.length;
      assert(
        chordCount >= 4 && chordCount <= 8,
        `Template "${tpl.id}" has ${chordCount} chords (between 4 and 8)`,
      );

      const totalDuration = tpl.chords.reduce(
        (sum, c) => sum + c.durationBeats,
        0,
      );
      assert(
        totalDuration >= 16 && totalDuration <= 24,
        `Template "${tpl.id}" duration is ${totalDuration} beats (between 16 and 24)`,
      );

      for (const chord of tpl.chords) {
        assert(
          chord.durationBeats >= 2 && chord.durationBeats <= 4,
          `Chord step duration ${chord.durationBeats} is between 2 and 4 beats`,
        );
      }
    }
  }

  // Test across all authentic key centers
  console.log('\n2b. Authentic Key Centers:');
  for (const key of AUTHENTIC_KEY_CENTERS) {
    const prog = generateProgression({ key, mood: 'smooth-rnb' });
    assert(
      prog.metadata.key === key,
      `Generated authentic neo-soul progression in key ${key}`,
    );
  }

  // Test across all 12 key centers
  console.log('\n3. Execution Across All 12 Key Centers:');
  for (const key of CHROMATIC_PITCH_CLASSES_FLAT) {
    const progression = generateProgression({ key, mood: 'spicy-altered' });
    assert(
      progression.steps.length >= 4 && progression.steps.length <= 8,
      `Generated progression in key ${key} has ${progression.steps.length} steps`,
    );
    assert(
      progression.metadata.key === key,
      `Progression metadata key matches requested key ${key}`,
    );
  }

  // 4. Voice-Leading Solver Verification
  console.log('\n4. Minimal-Displacement Voice-Leading Solver:');
  const testChords = [
    { root: 'Db' as PitchClass, extension: 'maj9' },
    { root: 'C' as PitchClass, extension: '7(#9)' },
    { root: 'F' as PitchClass, extension: 'm9' },
    { root: 'Eb' as PitchClass, extension: 'm9' },
    { root: 'Ab' as PitchClass, extension: '13' },
  ];

  const voiceSteps = solveProgressionVoiceLeading(testChords, false);
  assert(
    voiceSteps.length === testChords.length,
    `Solved voice leading produced ${voiceSteps.length} steps`,
  );

  for (let sIdx = 0; sIdx < voiceSteps.length; sIdx++) {
    const voices = voiceSteps[sIdx]!;
    assert(
      voices.length === 6,
      `Step ${sIdx + 1} has exactly 6 voices (Bass to Soprano)`,
    );

    const bass = voices[0]!;
    assert(
      bass.midi >= 36 && bass.midi <= 49,
      `Step ${sIdx + 1} bass note ${bass.pitch} (MIDI ${bass.midi}) is in low register [36, 49]`,
    );

    // Verify strict ascending order (no unisons, no voice crossings)
    let isAscending = true;
    for (let v = 0; v < voices.length - 1; v++) {
      if (voices[v]!.midi >= voices[v + 1]!.midi) {
        isAscending = false;
        break;
      }
    }
    assert(
      isAscending,
      `Step ${sIdx + 1} voices strictly ascending: ${voices.map((v) => v.pitch).join(', ')}`,
    );

    // Verify color assignment
    for (let v = 0; v < voices.length; v++) {
      assert(
        voices[v]!.color === VOICE_PALETTE[v],
        `Voice ${v} assigned VOICE_PALETTE[${v}]`,
      );
    }
  }

  // Check voice movement between consecutive steps
  for (let sIdx = 0; sIdx < voiceSteps.length - 1; sIdx++) {
    const vCurr = voiceSteps[sIdx]!;
    const vNext = voiceSteps[sIdx + 1]!;

    let commonTones = 0;
    let maxDisplacement = 0;

    for (let v = 1; v < 6; v++) {
      const diff = Math.abs(vNext[v]!.midi - vCurr[v]!.midi);
      if (diff === 0) commonTones++;
      if (diff > maxDisplacement) maxDisplacement = diff;
    }

    assert(
      maxDisplacement <= 6,
      `Step ${sIdx + 1} -> ${sIdx + 2} upper voice leaps stay <= 6 semitones (max leap ${maxDisplacement})`,
    );
  }

  // 5. Guitar Chord Diagram Solver Verification
  console.log('\n5. Guitar Chord Diagram Solver:');
  const sampleChordExtensions = [
    { root: 'Db' as PitchClass, ext: 'maj9' },
    { root: 'C' as PitchClass, ext: '7(#9)' },
    { root: 'F' as PitchClass, ext: 'm9' },
    { root: 'Eb' as PitchClass, ext: 'm9' },
    { root: 'Ab' as PitchClass, ext: '13' },
    { root: 'Db' as PitchClass, ext: 'maj7(#11)' },
    { root: 'C' as PitchClass, ext: '7(b13)' },
  ];

  for (const item of sampleChordExtensions) {
    const voicing = solveGuitarChordVoicing(item.root, item.ext);
    assert(
      voicing.frets.length === 6,
      `Guitar voicing for ${item.root}${item.ext} has 6 strings in frets array`,
    );
    assert(
      voicing.stringNotes.length === 6,
      `Guitar voicing for ${item.root}${item.ext} has 6 string notes`,
    );

    const numericalFrets = voicing.frets.filter(
      (f): f is number => typeof f === 'number' && f > 0,
    );
    if (numericalFrets.length > 0) {
      const minF = Math.min(...numericalFrets);
      const maxF = Math.max(...numericalFrets);
      const span = maxF - minF;
      assert(
        span <= 4,
        `Guitar voicing for ${item.root}${item.ext} span is ${span} frets (<= 4)`,
      );
      assert(
        voicing.baseFret !== undefined && voicing.baseFret >= 1,
        `baseFret is valid (${voicing.baseFret})`,
      );
    }
  }

  // 6. ProgressionTimeline API Verification across all 4 archetypes
  console.log('\n6. Full ProgressionTimeline API Verification:');
  for (const mood of archetypes) {
    const timeline = generateProgression({ mood, bpm: 68 });

    assert(
      timeline.steps.length >= 4 && timeline.steps.length <= 8,
      `Generated [${mood}] timeline with ${timeline.steps.length} chord steps`,
    );

    const totalBeats = timeline.getTotalBeats();
    assert(
      totalBeats >= 16 && totalBeats <= 24,
      `Total beats is ${totalBeats} (within 16 to 24 beats)`,
    );

    const totalDurationSeconds = timeline.getTotalDurationSeconds();
    const expectedSeconds = (totalBeats / 68) * 60;
    assert(
      Math.abs(totalDurationSeconds - expectedSeconds) < 0.001,
      `Total duration ${totalDurationSeconds.toFixed(2)}s matches expected ${expectedSeconds.toFixed(2)}s`,
    );

    // Test timeline beat resolution
    const resAtStart = timeline.getStepAtBeat(0);
    assert(
      resAtStart.stepIndex === 0 && resAtStart.beatWithinStep === 0,
      'Beat 0 resolves to first step index 0 with offset 0',
    );

    const resAtMid = timeline.getStepAtBeat(totalBeats / 2);
    assert(
      resAtMid.step !== undefined && resAtMid.stepIndex < timeline.steps.length,
      `Mid beat resolves to step ${resAtMid.stepIndex}: ${resAtMid.step.chordName}`,
    );

    const resAtWrap = timeline.getStepAtBeat(totalBeats + 1);
    assert(
      resAtWrap.step !== undefined,
      'Beat past totalBeats correctly wraps modulo timeline duration',
    );

    // Verify metadata
    assert(
      timeline.metadata.mood === mood,
      `Metadata mood matches "${mood}"`,
    );
    assert(
      timeline.metadata.chordNames.length === timeline.steps.length,
      `Metadata chord names count (${timeline.metadata.chordNames.length}) matches steps count`,
    );
    assert(
      timeline.metadata.description.length > 0,
      `Metadata carries description: "${timeline.metadata.description}"`,
    );
  }

  console.log('\n=============================================');
  console.log(`Results: ${passedTests} passed, ${failedTests} failed.`);
  if (failedTests > 0) {
    process.exit(1);
  }
}

runTests();
