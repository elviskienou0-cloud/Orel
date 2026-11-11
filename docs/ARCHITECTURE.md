# Architecture

## Principles

1. Share TypeScript domain logic wherever possible.
2. Platform adapters isolate camera, microphone, storage, filesystem, and notifications.
3. Process camera frames locally by default.
4. Optional AI providers are injected behind an interface; provider secrets never belong in browser code.
5. Capabilities expose explicit states: unavailable, permission-required, initializing, ready, error.

## Initial layers

- UI shell: React components and navigation.
- 3D presentation: Three.js scene in a dedicated component.
- Vision adapter: MediaPipe Tasks Vision and browser camera access.
- Gesture domain: pure functions converting normalized landmarks into semantic events.
- Voice adapter: browser speech APIs with capability detection.
- Memory adapter: local persistence initially, with a migration path to SQLite/native storage.
- Desktop/mobile shell: evaluate Tauri for Windows and Capacitor for Android after browser prototype validation. Keep domain logic independent from wrappers.

## Security and privacy

- Ask for camera/microphone permission only when activated.
- Never upload camera frames by default.
- Do not store biometric templates or identify people.
- Keep secrets out of VITE environment variables and Git.
