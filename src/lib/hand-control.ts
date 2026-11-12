export type ScreenSize = { width: number; height: number };
export type NormalizedPointer = { x: number; y: number };

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** Maps the camera's mirrored, normalized hand position to the usable screen area. */
export function mapHandToScreen(
  pointer: NormalizedPointer,
  screen: ScreenSize,
  sensitivity = 1
): { x: number; y: number } {
  if (screen.width <= 0 || screen.height <= 0) return { x: 0, y: 0 };
  const margin = 0.06;
  const usable = 1 - margin * 2;
  const centeredX = clamp((pointer.x - margin) / usable, 0, 1);
  const centeredY = clamp((pointer.y - margin) / usable, 0, 1);
  const gain = clamp(sensitivity, 0.7, 1.6);
  const x = clamp(0.5 + (centeredX - 0.5) * gain, 0, 1);
  const y = clamp(0.5 + (centeredY - 0.5) * gain, 0, 1);
  return {
    x: Math.round(x * (screen.width - 1)),
    y: Math.round(y * (screen.height - 1))
  };
}

/** Exponential smoothing to reduce camera jitter without adding a long delay. */
export function smoothPointer(
  previous: NormalizedPointer | null,
  next: NormalizedPointer,
  amount = 0.42
): NormalizedPointer {
  const alpha = clamp(amount, 0.05, 1);
  if (!previous) return { x: next.x, y: next.y };
  return {
    x: previous.x + (next.x - previous.x) * alpha,
    y: previous.y + (next.y - previous.y) * alpha
  };
}
