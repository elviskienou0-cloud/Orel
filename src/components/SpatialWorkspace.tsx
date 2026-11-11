import { Suspense, lazy, useEffect, useRef, useState, type PointerEvent } from "react";
import { Activity, AudioLines, Hand, Move } from "lucide-react";
import HandTracking from "./HandTracking";
import type { ChatMessage } from "../lib/memory";
import {
  findPanelAtPoint,
  movePanelToPointer,
  type SpatialPanelId,
  type SpatialPanelPositions
} from "../lib/spatial";
import type { HandPointer } from "../lib/gestures";

const Scene3D = lazy(() => import("./Scene3D"));

type Props = {
  handPointer: HandPointer;
  onPointer: (pointer: HandPointer) => void;
  messages: ChatMessage[];
  onNavigate: (destination: string) => void;
};

type DragState = {
  id: SpatialPanelId;
  offsetX: number;
  offsetY: number;
  source: "mouse" | "hand";
};

const initialPositions: SpatialPanelPositions = {
  assistant: { x: 0.035, y: 0.08 },
  memory: { x: 0.72, y: 0.1 },
  vision: { x: 0.34, y: 0.68 }
};

export default function SpatialWorkspace({ handPointer, onPointer, messages, onNavigate }: Props) {
  const stageRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const lastPinchRef = useRef(false);
  const [positions, setPositions] = useState<SpatialPanelPositions>(initialPositions);
  const positionsRef = useRef(positions);
  const latestMessage = messages[messages.length - 1];

  useEffect(() => {
    positionsRef.current = positions;
  }, [positions]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const pinching = handPointer.active && handPointer.gesture === "pinch";
    const rect = stage.getBoundingClientRect();
    const pointerX = handPointer.x * rect.width;
    const pointerY = handPointer.y * rect.height;

    if (pinching && !lastPinchRef.current && !dragRef.current) {
      const id = findPanelAtPoint(pointerX, pointerY, rect.width, rect.height, positionsRef.current);
      if (id) {
        const position = positionsRef.current[id];
        dragRef.current = {
          id,
          offsetX: pointerX - position.x * rect.width,
          offsetY: pointerY - position.y * rect.height,
          source: "hand"
        };
      }
    }

    if (pinching && dragRef.current?.source === "hand") {
      const drag = dragRef.current;
      const next = movePanelToPointer(pointerX, pointerY, rect.width, rect.height, drag.offsetX, drag.offsetY);
      setPositions((current) => ({ ...current, [drag.id]: next }));
    }

    if (!pinching && dragRef.current?.source === "hand") dragRef.current = null;
    lastPinchRef.current = pinching;
  }, [handPointer]);

  function beginMouseDrag(id: SpatialPanelId, event: PointerEvent<HTMLDivElement>) {
    const stage = stageRef.current;
    const panel = event.currentTarget.parentElement;
    if (!stage || !panel) return;
    const panelRect = panel.getBoundingClientRect();
    dragRef.current = {
      id,
      offsetX: event.clientX - panelRect.left,
      offsetY: event.clientY - panelRect.top,
      source: "mouse"
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function moveWithMouse(event: PointerEvent<HTMLDivElement>) {
    const drag = dragRef.current;
    const stage = stageRef.current;
    if (!drag || drag.source !== "mouse" || !stage) return;
    const rect = stage.getBoundingClientRect();
    const next = movePanelToPointer(
      event.clientX - rect.left,
      event.clientY - rect.top,
      rect.width,
      rect.height,
      drag.offsetX,
      drag.offsetY
    );
    setPositions((current) => ({ ...current, [drag.id]: next }));
  }

  function endMouseDrag() {
    if (dragRef.current?.source === "mouse") dragRef.current = null;
  }

  return (
    <div className="spatial-workspace">
      <div className="spatial-instructions">
        <strong>Manipulation de l’espace</strong>
        <span>Avec la souris : fais glisser l’en-tête d’un panneau. Avec la main : pince un panneau et déplace-le.</span>
      </div>
      <div className="spatial-camera">
        <HandTracking onPointer={onPointer}/>
      </div>
      <div
        className="spatial-stage"
        ref={stageRef}
        onPointerMove={moveWithMouse}
        onPointerUp={endMouseDrag}
        onPointerCancel={endMouseDrag}
      >
        <Suspense fallback={<div className="spatial-loading">Chargement du noyau 3D…</div>}>
          <Scene3D height={560} handControl={handPointer}/>
        </Suspense>
        {handPointer.active && (
          <div
            className="spatial-cursor"
            style={{ left: (handPointer.x * 100) + "%", top: (handPointer.y * 100) + "%" }}
            aria-hidden="true"
          />
        )}
        <article className="spatial-panel" style={{ left: (positions.assistant.x * 100) + "%", top: (positions.assistant.y * 100) + "%" }}>
          <div className="spatial-panel-header" onPointerDown={(event) => beginMouseDrag("assistant", event)}>
            <AudioLines size={16}/><strong>Assistant</strong><Move size={14}/>
          </div>
          <p>{latestMessage?.content.slice(0, 100) || "Aucune conversation récente."}</p>
          <button type="button" onClick={() => onNavigate("Assistant")}>Ouvrir l’assistant</button>
        </article>
        <article className="spatial-panel" style={{ left: (positions.memory.x * 100) + "%", top: (positions.memory.y * 100) + "%" }}>
          <div className="spatial-panel-header" onPointerDown={(event) => beginMouseDrag("memory", event)}>
            <Activity size={16}/><strong>Mémoire</strong><Move size={14}/>
          </div>
          <p>{messages.length} messages dans la session. La conservation durable dépend du réglage mémoire.</p>
          <button type="button" onClick={() => onNavigate("Mémoire")}>Consulter la mémoire</button>
        </article>
        <article className="spatial-panel" style={{ left: (positions.vision.x * 100) + "%", top: (positions.vision.y * 100) + "%" }}>
          <div className="spatial-panel-header" onPointerDown={(event) => beginMouseDrag("vision", event)}>
            <Hand size={16}/><strong>Vision gestuelle</strong><Move size={14}/>
          </div>
          <p>{handPointer.active ? "Geste actif : " + handPointer.gesture : "En attente d’un geste. Active la caméra pour contrôler le noyau."}</p>
          <button type="button" onClick={() => onNavigate("Vision & gestes")}>Ouvrir la vision</button>
        </article>
      </div>
    </div>
  );
}
