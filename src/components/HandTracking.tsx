import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Hand, LoaderCircle } from "lucide-react";
import { classifyGesture, GESTURE_ACTIONS, GESTURE_LABELS, type GestureName, type Landmark } from "../lib/gestures";

type Props = { onGesture?: (gesture: Exclude<GestureName, "unknown">) => void; onPointer?: (pointer: {x:number;y:number;gesture:GestureName;active:boolean}) => void };

export default function HandTracking({ onGesture, onPointer }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const landmarkerRef = useRef<{ detectForVideo: (video: HTMLVideoElement, timestamp: number) => { landmarks: Landmark[][] }; close: () => void } | null>(null);
  const rafRef = useRef<number>(0);
  const activeRef = useRef(false);
  const disposedRef = useRef(false);
  const startTokenRef = useRef(0);
  const lastFrameRef = useRef(0);
  const candidateRef = useRef<GestureName>("unknown");
  const candidateSinceRef = useRef(0);
  const lastSentRef = useRef<GestureName>("unknown");
  const callbackRef = useRef(onGesture);
  const pointerCallbackRef = useRef(onPointer);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(false);
  const [gesture, setGesture] = useState<GestureName>("unknown");
  const [hands, setHands] = useState(0);
  const [cameraDevices, setCameraDevices] = useState<Array<{deviceId:string;label:string}>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState("");
  const [message, setMessage] = useState("La caméra reste inactive jusqu'à ton autorisation.");

  useEffect(() => { callbackRef.current = onGesture; }, [onGesture]);
  useEffect(() => { pointerCallbackRef.current = onPointer; }, [onPointer]);

  async function refreshCameras() {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = (await navigator.mediaDevices.enumerateDevices())
        .filter((device) => device.kind === "videoinput")
        .map((device, index) => ({ deviceId: device.deviceId, label: device.label || "Caméra " + (index + 1) }));
      setCameraDevices(devices);
      setSelectedCameraId((current) => current || devices[0]?.deviceId || "");
    } catch { setCameraDevices([]); }
  }

  useEffect(() => {
    void refreshCameras();
    navigator.mediaDevices?.addEventListener?.("devicechange", refreshCameras);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", refreshCameras);
  }, []);

  function stopCamera() {
    startTokenRef.current += 1;
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
    pointerCallbackRef.current?.({ x: 0.5, y: 0.5, gesture: "unknown", active: false });
    setMessage("Caméra arrêtée. Le flux vidéo a été libéré.");
  }

  async function startCamera() {
    if (activeRef.current || loading) return;
    if (!navigator.mediaDevices?.getUserMedia) {
      setMessage("Caméra indisponible : utilise Chrome ou Edge sur localhost ou HTTPS.");
      return;
    }
    const token = ++startTokenRef.current;
    setLoading(true);
    setMessage("Demande d'autorisation caméra…");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { ...(selectedCameraId ? { deviceId: { exact: selectedCameraId } } : { facingMode: "user" }), width: { ideal: 640 }, height: { ideal: 480 }, frameRate: { ideal: 15, max: 20 } }
      });
      if (disposedRef.current || token !== startTokenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current = stream;
      void refreshCameras();
      const video = videoRef.current;
      if (!video) throw new Error("Élément vidéo introuvable.");
      video.srcObject = stream;
      await video.play();
      setMessage("Chargement du moteur de vision et du modèle de main…");
      const vision = await import("@mediapipe/tasks-vision");
      const fileset = await vision.FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm"
      );
      if (disposedRef.current || token !== startTokenRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
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
      if (disposedRef.current || token !== startTokenRef.current) {
        landmarker.close();
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
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
        const connections = vision.HandLandmarker.HAND_CONNECTIONS;
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
        const primaryHand = result.landmarks[0];
        const current = primaryHand ? classifyGesture(primaryHand) : "unknown";
        setGesture(current);
        if (primaryHand) {
          pointerCallbackRef.current?.({ x: primaryHand[8].x, y: primaryHand[8].y, gesture: current, active: current === "point" || current === "pinch" });
        } else {
          pointerCallbackRef.current?.({ x: 0.5, y: 0.5, gesture: "unknown", active: false });
        }
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
      if (disposedRef.current || token !== startTokenRef.current) return;
      setRunning(false);
      setLoading(false);
      const reason = error instanceof Error ? error.message : "Erreur inconnue.";
      setMessage(`Impossible de démarrer la vision : ${reason}`);
    }
  }

  useEffect(() => {
    disposedRef.current = false;
    return () => {
      disposedRef.current = true;
      startTokenRef.current += 1;
      activeRef.current = false;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach((track) => track.stop());
      landmarkerRef.current?.close();
      pointerCallbackRef.current?.({ x: 0.5, y: 0.5, gesture: "unknown", active: false });
    };
  }, []);

  const action = gesture === "unknown" ? "Présente une main devant la caméra." : GESTURE_ACTIONS[gesture];

  return (
    <div className="vision-module">
      <div className="camera-picker"><label htmlFor="orel-camera-select">Source vidéo</label><select id="orel-camera-select" value={selectedCameraId} onChange={(event) => setSelectedCameraId(event.target.value)} disabled={running || loading}><option value="">Caméra par défaut</option>{cameraDevices.map((device) => <option key={device.deviceId} value={device.deviceId}>{device.label}</option>)}</select><button type="button" className="quiet-button" onClick={() => void refreshCameras()} disabled={running || loading}>Actualiser</button></div>
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
        {running ? <button className="secondary-button" onClick={stopCamera}><CameraOff size={16}/> Arrêter la caméra</button> : loading ? <button className="secondary-button" onClick={stopCamera}><CameraOff size={16}/> Annuler l’initialisation</button> : <button className="primary-button" onClick={() => void startCamera()}><Camera size={16}/> Activer la caméra</button>}
      </div>
      <p className="notice" role="status">{message}</p>
      <p className="vision-privacy">Traitement des images sur cet appareil. Le modèle MediaPipe et son moteur WebAssembly sont téléchargés depuis des sources publiques au premier démarrage. Aucune image n'est envoyée par OREL.</p>
    </div>
  );
}
