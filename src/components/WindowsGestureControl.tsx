import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Hand, LockKeyhole, MousePointer2, ShieldCheck } from "lucide-react";
import HandTracking from "./HandTracking";
import { isDesktopRuntime } from "../lib/platform";
import { getWindowsScreenSize, moveWindowsPointer, scrollWindows, setWindowsLeftButton, type WindowsScreenSize } from "../lib/windows-control";
import { mapHandToScreen } from "../lib/hand-control";
import type { HandPointer } from "../lib/gestures";

export default function WindowsGestureControl() {
  const desktop = isDesktopRuntime();
  const [enabled, setEnabled] = useState(false);
  const [screen, setScreen] = useState<WindowsScreenSize | null>(null);
  const [sensitivity, setSensitivity] = useState(1);
  const [notice, setNotice] = useState("Active d'abord le contrôle, puis autorise la caméra.");
  const [lastAction, setLastAction] = useState("En attente");
  const pressedRef = useRef(false);
  const previousYRef = useRef<number | null>(null);
  const lastScrollRef = useRef(0);
  const busyRef = useRef(false);

  const releaseButton = useCallback(() => {
    if (!pressedRef.current) return;
    pressedRef.current = false;
    void setWindowsLeftButton(false).catch((error) => {
      setNotice(error instanceof Error ? error.message : "Impossible de relâcher le bouton gauche.");
    });
  }, []);

  useEffect(() => {
    if (!desktop) return;
    void getWindowsScreenSize()
      .then(setScreen)
      .catch((error) => setNotice(error instanceof Error ? error.message : "Impossible de lire la résolution Windows."));
  }, [desktop]);

  useEffect(() => {
    if (!enabled) {
      releaseButton();
      previousYRef.current = null;
      return;
    }
    const stopOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setEnabled(false);
        setNotice("Contrôle arrêté avec Échap. Le bouton de la souris a été libéré.");
      }
    };
    window.addEventListener("keydown", stopOnEscape);
    setNotice("Contrôle actif. Index pour déplacer, pincement pour cliquer ou glisser, deux doigts pour défiler.");
    return () => {
      window.removeEventListener("keydown", stopOnEscape);
      releaseButton();
    };
  }, [enabled, releaseButton]);

  useEffect(() => () => releaseButton(), [releaseButton]);

  const handlePointer = useCallback((pointer: HandPointer) => {
    if (!enabled || !desktop || !screen || busyRef.current) {
      if (!pointer.active) releaseButton();
      return;
    }

    if (!pointer.active) {
      releaseButton();
      previousYRef.current = null;
      return;
    }

    if (pointer.gesture === "victory") {
      releaseButton();
      if (previousYRef.current !== null) {
        const delta = Math.round((previousYRef.current - pointer.y) * 1400);
        const now = Date.now();
        if (Math.abs(delta) >= 18 && now - lastScrollRef.current >= 75) {
          lastScrollRef.current = now;
          busyRef.current = true;
          void scrollWindows(Math.max(-600, Math.min(600, delta)))
            .then(() => setLastAction("Défilement"))
            .catch((error) => setNotice(error instanceof Error ? error.message : "Défilement impossible."))
            .finally(() => { busyRef.current = false; });
        }
      }
      previousYRef.current = pointer.y;
      return;
    }

    previousYRef.current = null;
    const position = mapHandToScreen(pointer, screen, sensitivity);
    busyRef.current = true;
    void moveWindowsPointer(position.x, position.y)
      .then(() => setLastAction(pointer.gesture === "pinch" ? "Déplacement avec pincement" : "Curseur déplacé"))
      .catch((error) => setNotice(error instanceof Error ? error.message : "Déplacement du curseur impossible."))
      .finally(() => { busyRef.current = false; });

    if (pointer.gesture === "pinch" && !pressedRef.current) {
      pressedRef.current = true;
      void setWindowsLeftButton(true).then(() => setLastAction("Clic maintenu / glisser-déposer"))
        .catch((error) => {
          pressedRef.current = false;
          setNotice(error instanceof Error ? error.message : "Clic impossible.");
        });
    } else if (pointer.gesture !== "pinch") {
      releaseButton();
    }
  }, [desktop, enabled, releaseButton, screen, sensitivity]);

  function toggleControl() {
    if (!desktop) {
      setNotice("Installe et lance OREL Desktop pour utiliser le contrôle global de Windows.");
      return;
    }
    if (!screen) {
      setNotice("La résolution Windows n'est pas encore disponible.");
      return;
    }
    if (enabled) {
      setEnabled(false);
      setNotice("Contrôle désactivé. Le bouton gauche est relâché.");
    } else {
      setEnabled(true);
    }
  }

  return (
    <section className="workspace windows-control">
      <div className="panel-heading">
        <div><span className="eyebrow">CONTRÔLE NATIF WINDOWS</span><h2>Manipulation par les mains</h2></div>
        <MousePointer2 size={22}/>
      </div>
      <p className="panel-description">Le contrôle gestuel agit sur le curseur Windows et donc sur l'application qui se trouve au premier plan. Il ne dépend pas d'une intégration spécifique à Chrome, Word ou VS Code.</p>

      {!desktop && <div className="control-warning"><AlertTriangle size={18}/> Le mode navigateur ne peut pas piloter Windows. Cette fonction exige l'application OREL Desktop installée.</div>}
      {desktop && screen && <p className="control-screen-info">Écran détecté : {screen.width} × {screen.height} pixels.</p>}

      <div className="control-safety">
        <div><ShieldCheck size={18}/><span><strong>{enabled ? "Contrôle global activé" : "Contrôle global désactivé"}</strong><small>{enabled ? "Les gestes peuvent agir dans les applications Windows." : "Aucun mouvement ni clic Windows ne sera envoyé."}</small></span></div>
        <button type="button" className={enabled ? "secondary-button control-stop" : "primary-button"} onClick={toggleControl} disabled={!desktop || !screen}>
          {enabled ? "Désactiver le contrôle" : "Activer le contrôle"}
        </button>
      </div>

      <div className="control-warning"><LockKeyhole size={17}/> La caméra et le contrôle global nécessitent deux actions distinctes. Un pincement maintenu garde le bouton gauche enfoncé : relâche les doigts pour terminer un glisser-déposer. Échap arrête le contrôle.</div>

      <div className="gesture-map">
        <div><Hand size={18}/><span><strong>Index pointé</strong><small>Déplacer le curseur</small></span></div>
        <div><Hand size={18}/><span><strong>Pouce + index pincés</strong><small>Clic ; maintenir pour glisser-déposer</small></span></div>
        <div><Hand size={18}/><span><strong>Deux doigts en V</strong><small>Défilement vertical par mouvement de la main</small></span></div>
        <div><Hand size={18}/><span><strong>Main perdue ou caméra arrêtée</strong><small>Relâchement automatique du bouton gauche</small></span></div>
      </div>

      <label className="control-sensitivity">Sensibilité du curseur <strong>{sensitivity.toFixed(1)}×</strong>
        <input type="range" min="0.7" max="1.6" step="0.1" value={sensitivity} onChange={(event) => setSensitivity(Number(event.target.value))} disabled={!enabled}/>
      </label>
      <div className="control-status"><span>Dernière action : {lastAction}</span><span>{enabled ? "ACTIF" : "EN PAUSE"}</span></div>
      {notice && <p className="notice" role="status">{notice}</p>}

      <div className="panel-heading control-camera-heading"><div><span className="eyebrow">SUIVI DE LA MAIN</span><h2>Caméra et repérage</h2></div></div>
      <HandTracking onPointer={handlePointer}/>
      <p className="vision-privacy">Le flux vidéo est traité localement. OREL n'envoie pas les images de la webcam. Le contrôle natif est limité au déplacement du pointeur, au bouton gauche et à la molette verticale. Aucun clavier, terminal ou accès arbitraire aux fichiers n'est exposé.</p>
    </section>
  );
}
