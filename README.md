# OREL

OREL is a cross-platform interactive AI assistant project, developed Windows-first with an architecture intended to support Android later.

## V1 objective

Build a demonstrable desktop assistant with:
- a modular application shell;
- a 3D interface rendered with Three.js;
- webcam-based hand tracking using MediaPipe Tasks Vision;
- gesture-driven UI interactions;
- voice input/output and a persistent local memory layer, added incrementally.

## Current status

**Day 1 / foundation scaffold.** This repository currently contains the initial architecture and development plan. Features are not considered complete until implemented and tested on a real device.

## Development constraints

- Target development machine: Windows, 8 GB RAM.
- Hardware budget: 0 FCFA; use existing laptop webcam and screen.
- Keep camera processing local where possible.
- Never commit API keys, tokens, passwords, personal data, or local environment files.
- Provide graceful fallbacks when camera, microphone, or optional AI services are unavailable.

## Quick start

Requirements: Node.js 20+ and npm.

```bash
npm install
npm run dev
```

See [docs/ROADMAP.md](docs/ROADMAP.md), [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), and [CONTRIBUTING.md](CONTRIBUTING.md).
