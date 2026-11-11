export type SpatialPanelId = "assistant" | "memory" | "vision";
export type SpatialPanelPosition = { x: number; y: number };
export type SpatialPanelPositions = Record<SpatialPanelId, SpatialPanelPosition>;

export const SPATIAL_PANEL_WIDTH = 224;
export const SPATIAL_PANEL_HEIGHT = 154;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function findPanelAtPoint(
  x: number,
  y: number,
  stageWidth: number,
  stageHeight: number,
  positions: SpatialPanelPositions
): SpatialPanelId | null {
  const ids: SpatialPanelId[] = ["assistant", "memory", "vision"];
  for (const id of ids) {
    const position = positions[id];
    const left = position.x * stageWidth;
    const top = position.y * stageHeight;
    if (x >= left && x <= left + SPATIAL_PANEL_WIDTH &&
        y >= top && y <= top + SPATIAL_PANEL_HEIGHT) return id;
  }
  return null;
}

export function movePanelToPointer(
  pointerX: number,
  pointerY: number,
  stageWidth: number,
  stageHeight: number,
  offsetX: number,
  offsetY: number
): SpatialPanelPosition {
  if (stageWidth <= 0 || stageHeight <= 0) return { x: 0, y: 0 };
  const maxX = Math.max(0, stageWidth - SPATIAL_PANEL_WIDTH);
  const maxY = Math.max(0, stageHeight - SPATIAL_PANEL_HEIGHT);
  return {
    x: clamp((pointerX - offsetX) / stageWidth, 0, maxX / stageWidth),
    y: clamp((pointerY - offsetY) / stageHeight, 0, maxY / stageHeight)
  };
}
