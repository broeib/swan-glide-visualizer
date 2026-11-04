# Swan Glide Visualizer

A web-based neo-soul chord and voice-leading visualizer featuring real-time audio playback, continuous pitch ribbons, and dynamic guitar chord diagrams.

## Language

**Chord Step**:
A distinct harmonic unit in the progression timeline with a chord name, duration, voicing, and guitar diagram.
_Avoid_: Measure, segment, chord slice

**Voice Note**:
A single monophonic pitch within a chord step, defined by its note name, MIDI value, display pitch, and layer color.
_Avoid_: Pitch node, tone, note point

**Voice Ribbon**:
A continuous horizontal cubic spline path representing the melodic trajectory of an individual voice across chord changes.
_Avoid_: Voice line, pitch trace, stream

**Playhead**:
The fixed vertical reference line positioned at 35% of the viewport width where the active notes intersect and sound.
_Avoid_: Cursor, scrub line, current time indicator

**Guitar Diagram**:
A 6-string chord box displaying nut or fret position, pressed frets, barre markings, muted strings, and note labels.
_Avoid_: Chord chart, fret grid, tab box
