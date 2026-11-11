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
