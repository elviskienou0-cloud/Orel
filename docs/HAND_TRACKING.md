# Vision gestuelle OREL

## Activation

1. Open OREL through `http://localhost:5173` or an HTTPS origin.
2. Navigate to **Vision & gestes**.
3. Select **Activer la caméra** and authorize camera access in the browser.
4. Keep one hand clearly visible, palm facing the camera, with good front lighting.
5. Wait for the first model download and initialization to finish.
6. Select **Arrêter la caméra** to stop the stream and release the camera.

## Runtime assets

The first activation downloads:
- MediaPipe Tasks Vision WebAssembly files from jsDelivr, pinned to version 0.10.22.
- The Hand Landmarker float16 model from Google's public MediaPipe model storage.

The model runs locally after download. OREL does not upload webcam frames. A network connection is required for the initial download unless the browser already has cached assets.

## Initial gestures

| Gesture | First V1 behavior |
|---|---|
| Open palm | Activate 3D hand-control mode on the Vision screen, only if shortcuts are enabled |
| Closed fist | Navigate to Home, only if shortcuts are enabled |
| Two fingers / victory | Navigate to Assistant, only if shortcuts are enabled |
| Index pointing | Recognized and displayed; no action bound yet |
| Thumb-index pinch | Recognized and displayed; no action bound yet |

A gesture must remain stable for approximately 500 ms before OREL emits it. This debounce reduces accidental repeated commands.

## Privacy and safety

- Camera access is requested only after the user presses the activation button.
- Camera processing is performed locally in the browser.
- Audio capture is disabled in the hand-tracking component.
- The camera stream is stopped when the user presses Stop or leaves the component.
- Navigation shortcuts are off by default.
- Browser camera permission does not grant Windows filesystem, process, shell or system permissions.

## Current limitations

- Gesture classification is heuristic and depends on camera angle, lighting, hand orientation and individual anatomy.
- Thumb and finger extension estimates are not yet calibrated for every hand orientation.
- Only the first detected hand is used for gesture classification; both hands are tracked and drawn.
- Pointing and pinch do not yet manipulate 3D objects.
- The camera selector, gesture sensitivity controls, per-user calibration and native Windows camera integration remain future work.
- The first model download requires Internet access.
