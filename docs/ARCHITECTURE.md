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


## Assistant core (V0.2)

- Conversation UI supports text input and browser speech recognition/synthesis where available.
- Local conversation history is stored in browser localStorage (maximum 100 messages) and can be disabled or erased by the user.
- Optional local model adapter targets an Ollama-compatible `/api/chat` endpoint. The default is `http://localhost:11434` with model `qwen2.5:3b`; the model must already be installed and running.
- The browser must be allowed by Ollama's CORS/origin configuration. Do not expose the Ollama service to a public network.
- If Ollama is unavailable, OREL only answers a few explicitly implemented local intents. It must not pretend that a full AI model is connected.

## Permission and desktop security model

- Camera and microphone access are requested only after an explicit user action. Camera test streams are stopped immediately after permission is checked.
- Browser permissions do not grant Windows filesystem, process, shell, registry, or global keyboard access.
- Windows control is intentionally unavailable in the browser build. A future Tauri desktop adapter must expose narrow, typed actions rather than a general unrestricted shell.
- File operations should be limited to user-selected folders; destructive operations, software installation, external messages, and system configuration require a per-action confirmation.
- Every desktop capability must have a visible permission state, a revocation path, and an audit record. Never store credentials in localStorage or VITE-prefixed variables.


## Browser hand-tracking adapter

- The Vision & gestes screen dynamically imports the pinned MediaPipe Tasks Vision 0.10.35 package.
- The Hand Landmarker runs in VIDEO mode with at most two hands. The first implementation uses the CPU delegate and throttles inference to roughly 11 frames per second to limit load on an 8 GB laptop.
- Webcam source selection is available after browser device enumeration. The user must stop the stream before changing camera.
- The video stream is requested only after a click, with audio disabled. The stream is stopped on user action and component cleanup, including cancellation during model initialization.
- Gesture classification is a local heuristic over the 21 normalized landmarks. It is not biometric identification and does not save hand geometry.
- Gesture navigation shortcuts are disabled by default. Three stable gestures can trigger navigation or activate the 3D mode; pointing rotates the 3D core and pinch scales it while the camera remains active.
- MediaPipe WASM and model files are fetched from pinned/public URLs at first use. Camera frames remain local; initial model/runtime download still requires Internet access.
- The synchronous video inference loop may briefly block the browser UI. A Web Worker is a future optimization if real-device profiling shows unacceptable frame drops or latency.
