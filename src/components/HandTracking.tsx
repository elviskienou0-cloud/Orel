import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Hand, LoaderCircle } from "lucide-react";
import { classifyGesture, GESTURE_ACTIONS, GESTURE_LABELS, type GestureName, type Landmark } from "../lib/gestures";

type Props = { onGesture?: (gesture: Exclude<GestureName, "unknown">) => void };

export default function HandTracking({ onGesture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<{ detectForVideo: (video: HTMLVideoElement, timestamp: number) => { landmarks: Landmark[][] }; close: () => void } | null>(null);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);
  const lastFrameRef = useRef(0);
  const candidateRef = useRef<GestureName>("unknown");
  const candidateSinceRef = useRef(0);
  const lastSentRef = useRef<GestureName>("unknown");
  const callbackRef = useRef(onGesture);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gesture, setGesture] = useState<GestureName>("unknown");
  const [hands, setHands] = useState(0);
  const [message, setMessage] = useState("La caméra reste inactive jusqu'à ton autorisation.");

  useEffect(() => { callbackRef.current = onGesture; }, [onGesture]);

  function stopCamera() {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (canvas && context) context.clearRect(0, 0, canvas.width, canvas.height);
    setRunning(false);
    setLoading(false);
    setHands(0);
    setGesture("unknown");
    setMessage("Caméra arrêtée. Le flux vidéo a été libéré.");
  }

  async function startCamera() {
    if (activeRef.current || loading) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Caméra indisponible : utilise Chrome ou Edge sur localhost ou HTTPS.");
      return;
    }
    setLoading(true);
    setMessage("Demande d'autorisation caméra…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 20 } }
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) throw new Error("Élément vidéo introuvable.");
      video.srcObject = stream;
      await video.play();
      setMessage("Chargement du moteur de vision et du modèle de main…");
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
      );
      const options = {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "CPU" as const
        },
        runningMode: "VIDEO" as const,
        numHands: 2,
        minHandDetectionConfidence: 0.55,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5
      };
      const landmarker = await vision.HandLandmarker.createFromOptions(fileset, options);
      landmarkerRef.current = landmarker;
      activeRef.current = true;
      setRunning(true);
      setLoading(false);
      setMessage("Suivi actif. Les images sont analysées localement dans le navigateur.");
      const draw = (now: number) => {
        if (!activeRef.current || !videoRef.current || !landmarkerRef.current) return;
        rafRef.current = requestAnimationFrame(draw);
        if (now - lastFrameRef.current < 90 || videoRef.current.readyState < 2) return;
        lastFrameRef.current = now;
        const result = landmarkerRef.current.detectForVideo(videoRef.current, now);
        const canvas = canvasRef.current;
        const context = canvas?.getContext("2d");
        if (!canvas || !context || !videoRef.current) return;
        const video = videoRef.current;
        if (canvas.width !== video.videoWidth || canvas.height !== video.videoHeight) {
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
        }
        context.clearRect(0, 0, canvas.width, canvas.height);
        const palette = "#7de1ff";
        const connections = vision.HAND_CONNECTIONS;
        result.landmarks.forEach((points) => {
          context.strokeStyle = palette;
          context.lineWidth = Math.max(2, canvas.width / 320);
          for (const connection of connections) {
            const start = points[connection.start];
            const end = points[connection.end];
            if (!start || !end) continue;
            context.beginPath();
            context.moveTo(start.x * canvas.width, start.y * canvas.height);
            context.lineTo(end.x * canvas.width, end.y * canvas.height);
            context.stroke();
          }
          context.fillStyle = "#ffffff";
          for (const point of points) {
            context.beginPath();
            context.arc(point.x * canvas.width, point.y * canvas.height, Math.max(2, canvas.width / 240), 0, Math.PI * 2);
            context.fill();
          }
        });
        setHands(result.landmarks.length);
        const current = result.landmarks[0] ? classifyGesture(result.landmarks[0]) : "unknown";
        setGesture(current);
        if (current !== candidateRef.current) {
          candidateRef.current = current;
          candidateSinceRef.current = now;
        } else if (current !== "unknown" && current !== lastSentRef.current && now - candidateSinceRef.current > 500) {
          lastSentRef.current = current;
          callbackRef.current?.(current);
        }
        if (current === "unknown") lastSentRef.current = "unknown";
      };
      rafRef.current = requestAnimationFrame(draw);
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      activeRef.current = false;
      setRunning(false);
      setLoading(false);
      const reason = error instanceof Error ? error.message : "Erreur inconnue.";
      setMessage(`Impossible de démarrer la vision : ${reason}`);
    }
  }

  useEffect(() => () => {
    activeRef.current = false;
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    landmarkerRef.current?.close();
  }, []);

  const action = gesture === "unknown" ? "Présente une main devant la caméra." : GESTURE_ACTIONS[gesture];

  return (
    <div className="vision-module">
      <div className="vision-stage">
        <video ref={videoRef} className="vision-video" playsInline muted aria-label="Flux caméra pour le suivi des mains" />
        <canvas ref={canvasRef} className="vision-overlay" />
        {!running && !loading && <div className="vision-placeholder"><Hand size={35}/><span>ZONE DE SUIVI DES MAINS</span><small>La caméra est désactivée</small></div>}
        {loading && <div className="vision-placeholder"><LoaderCircle className="spin" size={30}/><span>INITIALISATION</span><small>Premier chargement : connexion nécessaire pour télécharger le modèle</small></div>}
        <span className={running ? "vision-live" : "vision-off"}>{running ? "VISION ACTIVE" : "VISION INACTIVE"}</span>
      </div>
      <div className="vision-stats">
        <div><span>MAINS DÉTECTÉES</span><strong>{hands}/2</strong></div>
        <div><span>GESTE RECONNU</span><strong>{GESTURE_LABELS[gesture]}</strong></div>
      </div>
      <p className="vision-action">{action}</p>
      <div className="vision-controls">
        {!running ? <button className="primary-button" onClick={() => void startCamera()} disabled={loading}><Camera size={16}/>{loading ? "Initialisation…" : "Activer la caméra"}</button> : <button className="secondary-button" onClick={stopCamera}><CameraOff size={16}/> Arrêter la caméra</button>}
      </div>
      <p className="notice" role="status">{message}</p>
      <p className="vision-privacy">Traitement des images sur cet appareil. Le modèle MediaPipe et son moteur WebAssembly sont téléchargés depuis des sources publiques au premier démarrage. Aucune image n'est envoyée par OREL.</p>
    </div>
  );
}
