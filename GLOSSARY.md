# Swan Glide Visualizer

A web-based neo-soul chord and voice-leading visualizer featuring real-time audio playback, continuous pitch ribbons, and dynamic guitar and piano chord diagrams.

## Language

**Chord Step**:
A distinct harmonic unit in the progression timeline with a chord name, duration, voicing, and guitar or keyboard diagram.
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

**Keyboard Diagram**:
A top-down chord chart displaying an illuminated piano keyboard with active pressed keys and note markers.
_Avoid_: Piano roll, key visualizer, keyboard view

**Harmony Engine**:
A procedural music theory component that creates progression timelines conforming to neo-soul harmonic rules and voice-leading constraints.
_Avoid_: Chord generator, song creator, progression builder

**Theme Preset**:
A named visual configuration defining the background gradient, ribbon palette, typography styling, and playhead halo colors for a generated video.
_Avoid_: Skin, style sheet, template

**Video Pipeline**:
The automated headless batch process that orchestrates harmony generation, multi-track audio synthesis, canvas animation rendering, and video encoding to disk.
_Avoid_: Batch exporter, video bot, automation script

**Cadence Template**:
A reusable harmonic blueprint defining relative chord movements, extensions, and durations in a progression.
_Avoid_: Chord formula, song pattern, progression preset

**Social Manifest**:
A metadata file generated alongside each video containing the title, description, chord breakdown, Instagram hashtags, and cover thumbnail path.
_Avoid_: Post metadata, info sheet, export summary

**Mood Archetype**:
A curated harmonic category (such as Dreamy Major or Spicy Altered) that determines scale degrees, chord qualities, and cadence probabilities.
_Avoid_: Genre tag, style mode, mood preset

**Publishing Bundle**:
The complete output set for a single generated song, comprising the encoded MP4 video, cover thumbnail image, and social caption text file.
_Avoid_: Export pack, release folder, asset package

**Pipeline Switch**:
A control script that enables or disables the recurring scheduled background cron job without impacting on-demand CLI commands.
_Avoid_: Cron switcher, daemon toggler, scheduler toggle
