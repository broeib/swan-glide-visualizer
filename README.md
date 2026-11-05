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

#### 1. Daily Video Batch Execution (10 Videos)

Generate 10 diversified neo-soul video visualizers, update the markdown gallery, and automatically commit and push to GitHub:

```bash
# Run the daily 10-video pipeline and push to GitHub
npm run pipeline:daily

# Or generate on-demand with custom parameters
npm run pipeline:generate -- --count 10
```

Each video in the daily set of 10 is automatically diversified:
- **Balanced Moods**: Distributed across `dreamy-major`, `melancholy-minor`, `spicy-altered`, and `smooth-rnb`.
- **Alternating Instruments**: 5 guitar fretboards and 5 piano keyboards.
- **Rotating Themes**: Balanced across the 5 visual presets (`pastel`, `dark`, `sunset`, `lofi`, `cream`).
- **Unique Progressions**: Different cadence templates and pitch centers for every video.

#### 2. Viewing Videos on GitHub

All generated bundles are cataloged in [`output/README.md`](./output/README.md). When pushed to GitHub:
- Click into [`output/`](./output/) or any date directory to see video cover thumbnails, chord breakdowns, and metadata.
- Click any cover thumbnail or **"Watch Video"** link to play the 1080x1920 60FPS MP4 video directly inside GitHub's built-in web player.

#### 3. Automation Options

##### Option A: Cloud Automation via GitHub Actions (Recommended)
The repository includes [`.github/workflows/daily-pipeline.yml`](./.github/workflows/daily-pipeline.yml). It automatically triggers every day at 09:00 UTC, renders 10 videos in headless Chromium, commits the bundles, and pushes them back to `main`. You can also trigger it manually from GitHub's **Actions** tab with one click.

##### Option B: Local Machine / Server Cron Job
To activate automatic daily video generation on your local machine or server:

```bash
# Enable the daily cron job (runs daily at 09:00 UTC and pushes to git)
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
