export type GestureName = "open_palm" | "fist" | "point" | "pinch" | "victory" | "unknown";
export type Landmark = { x: number; y: number; z: number };

function distance(a: Landmark, b: Landmark): number {
  return Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);
}

export function classifyGesture(points: Landmark[], pinchThreshold = 0.055): GestureName {
  if (points.length < 21) return "unknown";
  const indexUp = points[8].y < points[6].y;
  const middleUp = points[12].y < points[10].y;
  const ringUp = points[16].y < points[14].y;
  const pinkyUp = points[20].y < points[18].y;
  const thumbOpen = distance(points[4], points[5]) > distance(points[3], points[5]) * 1.12;
  const pinchDistance = distance(points[4], points[8]);

  if (pinchDistance < pinchThreshold) return "pinch";
  if (indexUp && middleUp && !ringUp && !pinkyUp) return "victory";
  if (indexUp && !middleUp && !ringUp && !pinkyUp) return "point";
  if (indexUp && middleUp && ringUp && pinkyUp && thumbOpen) return "open_palm";
  if (!indexUp && !middleUp && !ringUp && !pinkyUp && !thumbOpen) return "fist";
  return "unknown";
}

export const GESTURE_LABELS: Record<GestureName, string> = {
  open_palm: "Main ouverte",
  fist: "Poing fermé",
  point: "Index pointé",
  pinch: "Pincement",
  victory: "Deux doigts",
  unknown: "Aucun geste reconnu"
};

export const GESTURE_ACTIONS: Record<Exclude<GestureName, "unknown">, string> = {
  open_palm: "Activer le mode 3D sur cette page",
  fist: "Revenir à l'accueil",
  point: "Orienter le noyau 3D",
  pinch: "Agrandir le noyau 3D",
  victory: "Ouvrir l'assistant"
};

export type HandPointer = { x: number; y: number; gesture: GestureName; active: boolean };
