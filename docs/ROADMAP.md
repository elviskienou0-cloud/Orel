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
| Camera permission test | Implemented | MediaPipe hand tracking and camera lifecycle |
| Text conversation UI | Implemented | Connect and validate a real local model |
| Ollama adapter | Implemented, not yet locally verified | Install/run Ollama, configure CORS, test model |
| Browser speech input/output | Implemented where browser APIs exist | Test Windows microphone, voice selection and interruption |
| Local conversation memory | Implemented with disable/erase controls | Searchable memories and export/import |
| Permission center | Initial UI implemented | Native Windows permission bridge and audit log |
| Hand gestures | Not implemented | MediaPipe landmarks and gesture mapping |
| Windows automation | Not implemented | Tauri shell, scoped actions, confirmations and audit trail |
| Android | Architecture only | Separate camera/voice permission and packaging validation |

The browser app does not have unrestricted Windows permissions. That requires a native desktop wrapper and must remain capability-based, user-approved and revocable.
