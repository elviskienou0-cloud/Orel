# OREL V1 roadmap (7-day sprint)

The seven-day target is a demonstrable prototype, not production-grade autonomy or a true optical hologram.

| Day | Focus | Acceptance criteria |
|---|---|---|
| 1 | Repository, architecture, app shell | Vite + React + TypeScript scaffold; local build passes |
| 2 | 3D scene | Three.js scene renders with an interactive object |
| 3 | Camera and hand landmarks | User grants camera access; landmarks appear locally |
| 4 | Gestures | At least four gestures trigger visible UI actions |
| 5 | Voice and memory | Basic speech input/output where supported; local persistence |
| 6 | Integration | Modules communicate through typed interfaces; permission/error states |
| 7 | Validation | Windows build, manual test checklist, limitations documented |

## Scope guardrails

- Prioritize reliable interaction over visual effects.
- The laptop screen is the display; no physical holographic projection is included.
- Do not claim a feature is complete until it has been run and verified.
- Android is an architectural target, not a guaranteed V1 deliverable in seven days.
- Measure performance on the actual 8 GB machine.


## Implementation checkpoint (2026-11-11)

| Capability | Current state | Remaining work |
|---|---|---|
| React/Vite shell | Implemented | UX validation on the target laptop |
| Animated Three.js core | Prototype implemented | Pointer and gesture interaction |
| Camera and hand tracking | Implemented in browser prototype | Validate camera lifecycle, FPS and model loading on target laptop |
| Text conversation UI | Implemented | Connect and validate a real local model |
| Ollama adapter | Implemented, not yet locally verified | Install/run Ollama, configure CORS, test model |
| Browser speech input/output | Implemented where browser APIs exist | Test Windows microphone, voice selection and interruption |
| Local conversation memory | Implemented with disable/erase controls | Searchable memories and export/import |
| Permission center | Initial UI implemented | Native Windows permission bridge and audit log |
| Hand gestures | First implementation added | Validate on target webcam; improve orientation and per-user calibration |
| Windows automation | Not implemented | Tauri shell, scoped actions, confirmations and audit trail |
| Android | Architecture only | Separate camera/voice permission and packaging validation |

The browser app does not have unrestricted Windows permissions. That requires a native desktop wrapper and must remain capability-based, user-approved and revocable.


## Vision gestuelle implementation (2026-11-11)

- The Vision & gestes screen now starts and stops a webcam stream explicitly.
- MediaPipe Tasks Vision loads its WebAssembly runtime from jsDelivr and the Hand Landmarker model from Google's public model storage on first activation.
- Inference runs locally in the browser, at a requested 640x480 camera resolution and a throttled target near 10-11 frames per second.
- Up to two hands and their 21 landmarks are drawn on a mirrored canvas overlay.
- The first heuristic classifier recognizes open palm, fist, pointing index, pinch and victory/two-finger gestures.
- Stable gestures must persist for 500 ms before an event is emitted. Navigation shortcuts are disabled by default and must be explicitly enabled.
- Index pointing rotates the 3D core and thumb-index pinch scales it while the camera is active on the Vision screen.
- Current shortcuts: open palm -> activate 3D control mode without leaving the Vision screen; fist -> Home; victory -> Assistant. Index pointing rotates the core and pinch scales it.
- Camera frames are not uploaded by OREL. A network connection is needed on first use to fetch the model and WebAssembly assets; browser caching may help subsequent launches.
- Manual validation is still required on the target Windows laptop. The feature must not be considered fully validated until camera selection, lighting, both hands, stop/restart, and CPU load have been tested.
