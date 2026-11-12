import { useEffect, useRef, useState } from "react";
import { Camera, CameraOff, Eye, MonitorUp } from "lucide-react";
import { analyzeScreenWithOllama, type OllamaConfig } from "../lib/ollama";

type Props = { config: OllamaConfig };

export default function ScreenVision({ config }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [sharing, setSharing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [question, setQuestion] = useState("Décris ce qui est affiché et indique les éléments importants.");
  const [answer, setAnswer] = useState("");
  const [notice, setNotice] = useState("Le partage d'écran reste désactivé jusqu'à ton autorisation.");

  function stopSharing() {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setSharing(false);
    setNotice("Partage d'écran arrêté. Le flux a été libéré.");
  }

  async function startSharing() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      setNotice("Le partage d'écran n'est pas pris en charge dans cet environnement. Utilise OREL Desktop ou un navigateur compatible.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 8, max: 12 } },
        audio: false
      });
      streamRef.current = stream;
      const video = videoRef.current;
      if (!video) {
        stream.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        throw new Error("Aperçu vidéo indisponible.");
      }
      video.srcObject = stream;
      await video.play();
      stream.getVideoTracks()[0]?.addEventListener("ended", stopSharing, { once: true });
      setSharing(true);
      setAnswer("");
      setNotice("Écran partagé. Aucune image n'est envoyée tant que tu ne demandes pas une analyse.");
    } catch (error) {
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
      setSharing(false);
      setNotice(error instanceof Error ? error.message : "Partage d'écran refusé ou indisponible.");
    }
  }

  async function analyze() {
    const video = videoRef.current;
    if (!sharing || !video || video.videoWidth < 1 || video.videoHeight < 1 || busy) return;
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, 1280 / video.videoWidth, 900 / video.videoHeight);
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) {
      setNotice("Impossible de préparer l'image de l'écran.");
      return;
    }
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.78);
    const imageBase64 = dataUrl.slice(dataUrl.indexOf(",") + 1);
    setBusy(true);
    setNotice("Analyse en cours sur le serveur Ollama local…");
    try {
      const result = await analyzeScreenWithOllama(config, question, imageBase64);
      setAnswer(result);
      setNotice("Analyse terminée. L'image a été envoyée uniquement au serveur Ollama local configuré.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Analyse impossible.");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  return (
    <section className="workspace screen-vision">
      <div className="panel-heading">
        <div><span className="eyebrow">VISION CONTEXTUELLE</span><h2>Comprendre l'écran</h2></div>
        <Eye size={22}/>
      </div>
      <p className="panel-description">OREL peut examiner une capture d'écran avec un modèle Ollama compatible avec les images. Le partage est manuel, l'audio est désactivé et aucune capture n'est transmise avant ton clic sur « Analyser ».</p>
      <div className="screen-preview">
        <video ref={videoRef} playsInline muted aria-label="Aperçu de l'écran partagé"/>
        {!sharing && <div className="screen-placeholder"><MonitorUp size={34}/><strong>Aucun écran partagé</strong><span>Choisis une fenêtre, un onglet ou l'écran entier.</span></div>}
        <span className={sharing ? "vision-live" : "vision-off"}>{sharing ? "PARTAGE ACTIF" : "PARTAGE INACTIF"}</span>
      </div>
      <div className="screen-actions">
        {sharing
          ? <button className="secondary-button control-stop" onClick={stopSharing}><CameraOff size={16}/> Arrêter le partage</button>
          : <button className="primary-button" onClick={() => void startSharing()}><MonitorUp size={16}/> Partager mon écran</button>}
      </div>
      <label className="screen-question">Que veux-tu qu'OREL examine ?
        <textarea value={question} onChange={(event) => setQuestion(event.target.value)} maxLength={1200} rows={3} placeholder="Ex. : explique cette erreur et indique comment la corriger."/>
      </label>
      <button className="primary-button" disabled={!sharing || busy || !question.trim()} onClick={() => void analyze()}>
        <Eye size={16}/> {busy ? "Analyse…" : "Analyser la capture"}
      </button>
      {notice && <p className="notice" role="status">{notice}</p>}
      {answer && <article className="screen-answer"><strong>Analyse d'OREL</strong><p>{answer}</p></article>}
      <p className="vision-privacy">Confidentialité : partage déclenché par l'utilisateur, capture ponctuelle, redimensionnement à 1280 × 900 maximum. La capture est envoyée au serveur local indiqué dans les réglages Ollama. N'analyse pas d'informations confidentielles si tu ne souhaites pas les transmettre à ce modèle local.</p>
    </section>
  );
}
