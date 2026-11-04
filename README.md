# Swan Glide Visualizer

A web-based neo-soul chord and voice-leading visualizer inspired by Swan Glide and @ultravioletchorus.

## Features

- **Continuous Voice-Leading Spline Timeline**: 6-voice cubic Bezier ribbons gliding smoothly between chord steps.
- **Interactive Playhead**: Fixed vertical playhead line anchored at 37% viewport width with glowing intersection nodes and real-time pitch badges.
- **Dual Instrument Visualizations**: Toggle between dynamic 6-string Guitar Fretboards and illuminated 2.5-octave Piano Keyboard diagrams.
- **Procedural Neo-Soul Harmony Engine**: Rule-based jazz matrix generating authentic chord progressions across 4 mood archetypes (`dreamy-major`, `melancholy-minor`, `spicy-altered`, `smooth-rnb`) with minimal-displacement Viterbi voice-leading.
- **5 Curated Theme Presets**: Pastel Rose, Neon Midnight, Warm Sunset, Lofi Slate, and Warm Paper with reactive gradients, glowing halos, and voice palettes.
- **Headless Multi-Track Audio Engine**: Studio-grade Rhodes electric piano, sub-bass foundation, swung lofi drum machine, and vinyl atmosphere with faster-than-realtime 48kHz WAV export.
- **Headless 1080x1920 60FPS Video Pipeline**: Puppeteer Chromium frame-stepping piped directly into FFmpeg stdin for 100% deterministic video rendering.
- **Automated Social Bundling & Scheduling**: Generates `video.mp4`, `cover.jpg`, and ready-to-copy `caption.txt` with formatted chord charts and hashtags. Includes cron scripts with a 30-day retention cleanup, starting OFF by default.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm
- ffmpeg

### Installation

```bash
npm install
```

### Interactive Web Studio

```bash
npm run dev
```

Use the interactive control toolbar to generate new songs, toggle between Guitar and Keyboard diagrams, switch themes, and preview playback live.

### Automated Video Generation Pipeline

#### 1. On-Demand Video Generation

Generate videos manually at any time without activating background jobs:

```bash
# Generate 1 video with random mood, instrument, and theme
npm run pipeline:generate

# Generate 3 videos with specific musical parameters
npm run pipeline:generate -- --count 3 --mood dreamy-major --instrument piano --theme dark
```

Output files are stored in `output/YYYY-MM-DD/song_<timestamp>_<archetype>/`:
- `video.mp4`: Broadcast-ready 1080x1920 60FPS vertical video.
- `cover.jpg`: High-resolution cover thumbnail image.
- `caption.txt`: Instagram caption with song title, key, tempo, chord breakdown, and hashtags.
- `manifest.json`: Structured song metadata.

#### 2. Scheduled Daily Cron Job (OFF by default)

To activate automatic daily video generation on your always-on VM (runs daily at 09:00 UTC and cleans up files older than 30 days):

```bash
# Enable the daily cron job
npm run pipeline:enable

# Disable the daily cron job at any time
npm run pipeline:disable
```

### Production Build

```bash
npm run build
```

## Architecture

- **Domain Model**: See [`GLOSSARY.md`](./GLOSSARY.md) for domain terminology.
- **Architecture Decisions**:
  - [`docs/adr/0001-spline-ribbon-architecture.md`](./docs/adr/0001-spline-ribbon-architecture.md)
  - [`docs/adr/0002-headless-cli-pipeline.md`](./docs/adr/0002-headless-cli-pipeline.md)
  - [`docs/adr/0003-offline-audio-synthesis.md`](./docs/adr/0003-offline-audio-synthesis.md)
