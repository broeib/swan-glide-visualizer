# Swan Glide Visualizer

A web-based neo-soul chord and voice-leading visualizer inspired by Swan Glide and @ultravioletchorus.

## Features

- **Continuous Voice-Leading Spline Timeline**: 5-voice cubic Bezier ribbons gliding smoothly between chord steps (Fm9 -> Ebm9 -> Bbm9 -> C7(b13)).
- **Interactive Playhead**: Fixed vertical playhead line anchored at 35% viewport width with glowing intersection nodes and real-time pitch badges.
- **Dynamic SVG Guitar Fretboard**: 6-string chord box displaying nut/frets offset indicator ("8fr"), barre pills, finger dots, muted/open markers, and string note labels underneath.
- **Headless Tone.js Audio Engine**: Polyphonic Rhodes electric piano sound design with low-pass filtering, transport synchronization, and safe browser autoplay handling.
- **Mobile-First 9:16 Portrait Shell**: Centered portrait card with pastel gradients (`from-pink-100 via-rose-100 to-purple-200`) and soft backdrop glassmorphism.

## Getting Started

### Prerequisites

- Node.js (v18 or later)
- npm

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

### Production Build

```bash
npm run build
```

## Architecture

- **Domain Model**: See [`GLOSSARY.md`](./GLOSSARY.md) for domain terminology.
- **Architecture Decisions**: See [`docs/adr/0001-spline-ribbon-architecture.md`](./docs/adr/0001-spline-ribbon-architecture.md).
