import { lazy, Suspense, useEffect, useRef, useState } from "react";
import {
  Activity, AudioLines, Camera, Check, Command, Hand, Layers3, LockKeyhole,
  Mic, MicOff, Send, Settings2, ShieldCheck, Sparkles, Trash2, Volume2, VolumeX
} from "lucide-react";
import { clearMessages, loadMessages, saveMessages, type ChatMessage } from "./lib/memory";
import { askOllama } from "./lib/ollama";
import { listenOnce, speak } from "./lib/voice";
import HandTracking from "./components/HandTracking";
import type { GestureName, HandPointer } from "./lib/gestures";

const Scene3D = lazy(() => import("./components/Scene3D"));
const CONFIG_KEY = "orel.ai-config.v1";
const MEMORY_ENABLED_KEY = "orel.memory-enabled.v1";

type AiConfig = { endpoint: string; model: string };
const defaultConfig: AiConfig = { endpoint: "http://localhost:11434", model: "qwen2.5:3b" };

function readMemoryEnabled(): boolean {
  try {
    return localStorage.getItem(MEMORY_ENABLED_KEY) !== "false";
  } catch {
    return true;
  }
}

function readConfig(): AiConfig {
  try {
    const saved = localStorage.getItem(CONFIG_KEY);
    return saved ? { ...defaultConfig, ...JSON.parse(saved) as Partial<AiConfig> } : defaultConfig;
  } catch {
    return defaultConfig;
  }
}

function localReply(prompt: string): string | null {
  const value = prompt.toLocaleLowerCase("fr-FR");
  if (/^(bonjour|salut|bonsoir|hello|hey)(\s|$|[!.?])/.test(value)) {
    return "Bonjour. Je suis OREL. Je peux répondre aux salutations et aux demandes simples. Connecte un modèle Ollama local pour activer la conversation intelligente.";
  }
  if (value.includes("quelle heure") || value.includes("l'heure") || value === "heure") {
    return `Il est actuellement ${new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(new Date())}.`;
  }
  if (value.includes("quelle date") || value.includes("nous sommes") || value === "date") {
    return `Nous sommes le ${new Intl.DateTimeFormat("fr-FR", { dateStyle: "full" }).format(new Date())}.`;
  }
  if (value.includes("qui es-tu") || value.includes("qui es tu")) {
    return "Je suis OREL, ton assistant personnel en cours de construction. Ma mémoire locale et mes fonctions vocales sont disponibles. Mon moteur de conversation doit être connecté pour répondre à des questions générales.";
  }
  return null;
}

export default function App() {
  const [active, setActive] = useState("Accueil");
  const [cameraReady, setCameraReady] = useState(false);
  const [gestureShortcuts, setGestureShortcuts] = useState(false);
  const [gestureNotice, setGestureNotice] = useState("Les raccourcis gestuels sont désactivés par défaut.");
  const [handPointer, setHandPointer] = useState<HandPointer>({ x: 0.5, y: 0.5, gesture: "unknown", active: false });
  const [microphoneReady, setMicrophoneReady] = useState(false);
  const [listening, setListening] = useState(false);
  const [voiceReplies, setVoiceReplies] = useState(false);
  const [memoryEnabled, setMemoryEnabled] = useState(readMemoryEnabled);
  const [messages, setMessages] = useState<ChatMessage[]>(() => loadMessages());
  const [draft, setDraft] = useState("");
  const [config, setConfig] = useState<AiConfig>(() => readConfig());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const cancelListening = useRef<(() => void) | null>(null);
  const chatEnd = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (memoryEnabled) saveMessages(messages);
    else clearMessages();
    try { localStorage.setItem(MEMORY_ENABLED_KEY, String(memoryEnabled)); } catch { /* Storage may be unavailable. */ }
  }, [messages, memoryEnabled]);

  useEffect(() => {
    chatEnd.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  useEffect(() => () => cancelListening.current?.(), []);

  function addMessage(role: ChatMessage["role"], content: string) {
    const message: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      role,
      content,
      createdAt: Date.now()
    };
    setMessages((current) => [...current, message].slice(-100));
  }

  async function sendMessage(text = draft) {
    const prompt = text.trim();
    if (!prompt || busy) return;
    setDraft("");
    addMessage("user", prompt);
    setBusy(true);
    setNotice("");
    try {
      const local = localReply(prompt);
      const answer = local ?? await askOllama(config, messages, prompt);
      addMessage("assistant", answer);
      if (voiceReplies) speak(answer);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Erreur inconnue.";
      addMessage("assistant", `Je ne peux pas encore traiter cette demande. ${reason} Pour activer les réponses intelligentes, démarre Ollama sur cet ordinateur et vérifie le modèle configuré.`);
    } finally {
      setBusy(false);
    }
  }

  async function requestCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setNotice("La caméra nécessite un navigateur compatible et une origine sécurisée (localhost ou HTTPS).");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      stream.getTracks().forEach((track) => track.stop());
      setCameraReady(true);
      setNotice("Accès caméra vérifié. Aucun flux vidéo n'est conservé.");
    } catch {
      setCameraReady(false);
      setNotice("Accès caméra refusé ou indisponible. Vérifie les autorisations Windows et du navigateur.");
    }
  }

  function startListening() {
    if (listening) {
      cancelListening.current?.();
      cancelListening.current = null;
      setListening(false);
      return;
    }
    setNotice("");
    setListening(true);
    const stop = listenOnce(
      (text) => {
        setListening(false);
        cancelListening.current = null;
        setMicrophoneReady(true);
        void sendMessage(text);
      },
      (message) => {
        setListening(false);
        cancelListening.current = null;
        setNotice(message);
      }
    );
    cancelListening.current = stop;
    if (!stop) setListening(false);
  }

  function handleGesture(gesture: Exclude<GestureName, "unknown">) {
    const destinations: Partial<Record<Exclude<GestureName, "unknown">, string>> = {
      open_palm: "Interface 3D",
      fist: "Accueil",
      victory: "Assistant"
    };
    if (gestureShortcuts && gesture === "open_palm") {
      setGestureNotice("Mode 3D actif : utilise l’index pour orienter le noyau et le pincement pour zoomer.");
      return;
    }
    const destination = destinations[gesture];
    if (gestureShortcuts && destination) {
      setActive(destination);
      setGestureNotice(`Geste reconnu : ${gesture}. Navigation vers ${destination}.`);
    } else {
      setGestureNotice(`Geste reconnu : ${gesture}. ${gestureShortcuts ? "Aucun raccourci associé." : "Active les raccourcis pour autoriser la navigation gestuelle."}`);
    }
  }

  function saveConfig() {
    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
      setNotice("Configuration locale enregistrée sur cet appareil.");
    } catch {
      setNotice("Impossible d'enregistrer la configuration dans le navigateur.");
    }
  }

  function eraseMemory() {
    clearMessages();
    setMessages([]);
    setNotice("Mémoire locale effacée.");
  }

  return (
    <main className="shell">
      <aside className="sidebar">
        <div className="brand"><div className="brand-mark"><Sparkles size={20}/></div><div><strong>OREL</strong><span>PERSONAL INTELLIGENCE</span></div></div>
        <div className="nav-label">ESPACE</div>
        {["Accueil", "Assistant", "Interface 3D", "Vision & gestes", "Voix", "Mémoire", "Permissions"].map((item) =>
          <button className={active === item ? "nav-item active" : "nav-item"} key={item} onClick={() => setActive(item)}><Command size={16}/>{item}</button>
        )}
        <div className="sidebar-bottom"><ShieldCheck size={16}/><span>Accès contrôlés · local prioritaire</span></div>
      </aside>

      <section className="content">
        <header className="topbar">
          <div><span className="eyebrow">PROJET PERSONNEL · V1</span><h1>{active}</h1></div>
          <div className="system-pill"><span className="status-dot"/> Interface opérationnelle</div>
        </header>

        {active === "Accueil" && <>
          <section className="hero">
            <div className="hero-copy"><span className="eyebrow">INTERFACE INTELLIGENTE</span><h2>OREL prend forme.<br/>Une étape à la fois.</h2><p>Un assistant personnel avec conversation locale, mémoire contrôlable, voix, vision et environnement 3D. Les accès sensibles restent sous ton contrôle.</p><div className="hero-actions"><button className="primary-button" onClick={() => setActive("Assistant")}><AudioLines size={17}/>Ouvrir l'assistant</button><span className="micro-note">Traitement local privilégié</span></div></div>
            <Suspense fallback={<div className="scene3d scene3d-loading" aria-label="Chargement de la scène 3D"><span className="scene3d-label">INITIALISATION 3D…</span></div>}><Scene3D /></Suspense>
          </section>
          <div className="section-heading"><div><span className="eyebrow">ARCHITECTURE MODULAIRE</span><h3>Modules OREL</h3></div><span className="muted">Fondations V1</span></div>
          <section className="module-grid">
            {[{name:"Assistant local",detail:"Conversation via Ollama",icon:AudioLines,status:"prototype"},{name:"Mémoire",detail:"Historique local effaçable",icon:Activity,status:"prototype"},{name:"Vision gestuelle",detail:"Webcam et suivi des mains",icon:Hand,status:"planned"},{name:"Interface 3D",detail:"Scène Three.js animée",icon:Layers3,status:"prototype"}].map(({name,detail,icon:Icon,status})=><article className="module-card" key={name}><div className="module-icon"><Icon size={19}/></div><div className="module-title">{name}</div><p>{detail}</p><span className={status==="prototype"?"module-status prototype":"module-status"}>{status==="prototype"?"Prototype":"À développer"}</span></article>)}
          </section>
        </>}

        {active === "Assistant" && <section className="workspace">
          <div className="panel-heading"><div><span className="eyebrow">CONVERSATION PRIVÉE</span><h2>Parler avec OREL</h2></div><button className="quiet-button" onClick={eraseMemory}><Trash2 size={15}/> Effacer l'historique</button></div>
          <div className="chat-window" aria-live="polite">
            {messages.length === 0 && <div className="empty-chat"><div className="module-icon"><Sparkles size={22}/></div><h3>OREL est prêt à recevoir une commande.</h3><p>Essaie « Bonjour OREL », « Quelle heure est-il ? » ou connecte Ollama pour les conversations générales.</p></div>}
            {messages.map((message)=><div className={`chat-message ${message.role}`} key={message.id}><span>{message.role === "user" ? "TOI" : "OREL"}</span><p>{message.content}</p>{message.role === "assistant" && <button className="speak-button" aria-label="Lire la réponse" onClick={() => speak(message.content)}><Volume2 size={14}/></button>}</div>)}
            {busy && <div className="typing-indicator">OREL réfléchit…</div>}
            <div ref={chatEnd}/>
          </div>
          <form className="composer" onSubmit={(event) => { event.preventDefault(); void sendMessage(); }}>
            <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Écris une instruction à OREL…" aria-label="Message à OREL"/>
            <button type="button" className={listening ? "icon-button listening" : "icon-button"} onClick={startListening} aria-label={listening ? "Arrêter l'écoute" : "Parler à OREL"}>{listening ? <MicOff size={18}/> : <Mic size={18}/>}</button>
            <button type="submit" className="send-button" disabled={busy || !draft.trim()} aria-label="Envoyer"><Send size={17}/></button>
          </form>
          <div className="chat-options"><label><input type="checkbox" checked={voiceReplies} onChange={(event) => setVoiceReplies(event.target.checked)}/> Lire les réponses à voix haute</label><span>{memoryEnabled ? "Mémoire locale activée" : "Mémoire désactivée"}</span></div>
        </section>}

        {active === "Permissions" && <section className="workspace">
          <div className="panel-heading"><div><span className="eyebrow">CENTRE DE CONTRÔLE</span><h2>Permissions de l'appareil</h2></div><LockKeyhole size={22}/></div>
          <p className="panel-description">OREL ne reçoit que les accès activés explicitement. Les autorisations Windows et celles du navigateur restent distinctes.</p>
          <div className="permission-list">
            <article className="permission-row"><div><Camera size={19}/><div><strong>Caméra</strong><small>{cameraReady ? "Accès testé puis flux arrêté" : "Non activée dans cette session"}</small></div></div><button className="secondary-button" onClick={requestCamera}>{cameraReady ? <Check size={15}/> : <Camera size={15}/>} {cameraReady ? "Vérifiée" : "Autoriser et tester"}</button></article>
            <article className="permission-row"><div><Mic size={19}/><div><strong>Microphone</strong><small>{microphoneReady ? "Reconnaissance vocale utilisée" : "Demande au premier usage vocal"}</small></div></div><button className="secondary-button" onClick={startListening}>{listening ? "Arrêter" : "Tester le micro"}</button></article>
            <article className="permission-row"><div><Activity size={19}/><div><strong>Mémoire locale</strong><small>{memoryEnabled ? "Conversations conservées sur cet appareil" : "Aucune conversation conservée"}</small></div></div><button className="secondary-button" onClick={() => setMemoryEnabled((value) => !value)}>{memoryEnabled ? "Désactiver" : "Activer"}</button></article>
            <article className="permission-row restricted"><div><Settings2 size={19}/><div><strong>Contrôle de Windows</strong><small>Indisponible dans le navigateur. Nécessitera une application desktop et une liste d'actions autorisées.</small></div></div><span className="locked-label">Verrouillé</span></article>
          </div>
          {notice && <p className="notice" role="status">{notice}</p>}
        </section>}

        {active === "Voix" && <section className="workspace"><div className="panel-heading"><div><span className="eyebrow">INTERACTION VOCALE</span><h2>Voix d'OREL</h2></div><AudioLines size={22}/></div><p className="panel-description">La reconnaissance vocale dépend du navigateur. La synthèse vocale utilise les voix installées sur Windows.</p><div className="voice-actions"><button className="primary-button" onClick={startListening}>{listening ? <MicOff size={17}/> : <Mic size={17}/>} {listening ? "Arrêter l'écoute" : "Démarrer l'écoute"}</button><button className="secondary-button" onClick={() => speak("Bonjour. Je suis OREL. Je suis prêt.")}><Volume2 size={16}/> Tester la voix</button><button className="secondary-button" onClick={() => window.speechSynthesis?.cancel()}><VolumeX size={16}/> Arrêter la lecture</button></div>{notice && <p className="notice">{notice}</p>}</section>}

        {active === "Mémoire" && <section className="workspace"><div className="panel-heading"><div><span className="eyebrow">DONNÉES LOCALES</span><h2>Mémoire d'OREL</h2></div><Activity size={22}/></div><p className="panel-description">OREL conserve au maximum 100 messages dans le stockage local du navigateur. Ces données ne sont pas synchronisées vers un serveur.</p><div className="memory-summary"><strong>{memoryEnabled ? messages.length : 0}</strong><span>messages conservés</span><button className="quiet-button" onClick={eraseMemory}><Trash2 size={15}/> Tout effacer</button></div><button className="secondary-button" onClick={() => setMemoryEnabled((value) => !value)}>{memoryEnabled ? "Désactiver la mémoire" : "Activer la mémoire"}</button></section>}

        {active === "Vision & gestes" && <section className="workspace"><div className="panel-heading"><div><span className="eyebrow">VISION PAR ORDINATEUR</span><h2>Suivi des mains</h2></div><Hand size={22}/></div><p className="panel-description">MediaPipe détecte jusqu'à deux mains et leurs 21 points de repère. Le traitement vidéo s'effectue localement. Le premier démarrage télécharge le moteur WebAssembly et le modèle de détection.</p><HandTracking onGesture={handleGesture} onPointer={setHandPointer}/><div className="gesture-shortcuts"><label><input type="checkbox" checked={gestureShortcuts} onChange={(event) => setGestureShortcuts(event.target.checked)}/> Autoriser les raccourcis de navigation par gestes</label><p>Paume ouverte : mode 3D · Poing : accueil · Deux doigts : assistant. Le pincement et l'index sont reconnus mais ne déclenchent pas encore d'action.</p><p className="notice" role="status">{gestureNotice}</p></div><div className="panel-heading vision-3d-heading"><div><span className="eyebrow">CONTRÔLE SPATIAL</span><h2>Interaction 3D par la main</h2></div></div><p className="panel-description">Index pointé : orienter le noyau. Pincement pouce-index : agrandir le noyau. Garde la main visible dans la caméra pendant le contrôle.</p><Scene3D handControl={handPointer}/></section>}

        {active === "Interface 3D" && <section className="workspace"><div className="panel-heading"><div><span className="eyebrow">RENDU SPATIAL</span><h2>Noyau 3D</h2></div><Layers3 size={22}/></div><Suspense fallback={<p>Chargement de la scène…</p>}><Scene3D handControl={handPointer}/></Suspense><p className="panel-description">Scène Three.js animée. La manipulation gestuelle des objets n'est pas encore connectée.</p></section>}

        {active === "Voix" || active === "Permissions" || active === "Vision & gestes" ? null : null}
        {notice && active === "Assistant" && <p className="notice" role="status">{notice}</p>}

        <section className="workspace config-panel">
          <div className="panel-heading"><div><span className="eyebrow">MOTEUR DE CONVERSATION</span><h2>Connexion IA locale</h2></div><Settings2 size={20}/></div>
          <p className="panel-description">Configuration facultative pour Ollama installé sur ce PC. Aucun compte ni clé API n'est envoyé. Si le serveur n'est pas lancé, seules les réponses locales simples fonctionnent.</p>
          <div className="config-fields"><label>Adresse du serveur<input value={config.endpoint} onChange={(event) => setConfig((value) => ({...value, endpoint:event.target.value}))}/></label><label>Modèle<input value={config.model} onChange={(event) => setConfig((value) => ({...value, model:event.target.value}))}/></label><button className="secondary-button" onClick={saveConfig}><Check size={15}/> Enregistrer</button></div>
        </section>

        <footer><span>OREL V0.2.0 · ASSISTANT CORE</span><span>Accès contrôlés · Windows first</span></footer>
      </section>
    </main>
  );
}
