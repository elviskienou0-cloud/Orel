import { lazy, Suspense, useState } from "react";

const Scene3D = lazy(() => import("./components/Scene3D"));
import { Activity, AudioLines, Camera, Command, Hand, Layers3, ShieldCheck, Sparkles } from "lucide-react";
type ModuleStatus = "planned" | "prototype";
const modules: {name:string;detail:string;icon:typeof Camera;status:ModuleStatus}[] = [
{name:"Vision gestuelle",detail:"Webcam et suivi des mains",icon:Hand,status:"planned"},
{name:"Interface spatiale",detail:"Scène 3D interactive",icon:Layers3,status:"prototype"},
{name:"Voix",detail:"Entrée et synthèse vocale",icon:AudioLines,status:"planned"},
{name:"Mémoire",detail:"Stockage local persistant",icon:Activity,status:"planned"}
];
export default function App(){
const [active,setActive]=useState("Accueil"); const [cameraRequested,setCameraRequested]=useState(false);
async function requestCamera(){try{const stream=await navigator.mediaDevices.getUserMedia({video:true,audio:false});stream.getTracks().forEach(t=>t.stop());setCameraRequested(true);}catch{setCameraRequested(false);alert("Caméra indisponible. Vérifie les autorisations Windows et du navigateur.");}}
return <main className="shell"><aside className="sidebar"><div className="brand"><div className="brand-mark"><Sparkles size={20}/></div><div><strong>OREL</strong><span>PERSONAL INTELLIGENCE</span></div></div><div className="nav-label">ESPACE</div>{["Accueil","Interface 3D","Vision & gestes","Voix","Mémoire"].map(item=><button className={active===item?"nav-item active":"nav-item"} key={item} onClick={()=>setActive(item)}><Command size={16}/>{item}</button>)}<div className="sidebar-bottom"><ShieldCheck size={16}/><span>Traitement local privilégié</span></div></aside>
<section className="content"><header className="topbar"><div><span className="eyebrow">PROJET PERSONNEL · V1</span><h1>{active}</h1></div><div className="system-pill"><span className="status-dot"/> Système initialisé</div></header>
<section className="hero"><div className="hero-copy"><span className="eyebrow">INTERFACE INTELLIGENTE</span><h2>Une nouvelle façon<br/>d'interagir avec le numérique.</h2><p>OREL réunit intelligence artificielle, vision par ordinateur, voix et environnement 3D dans une expérience conçue pour évoluer de Windows vers Android.</p><div className="hero-actions"><button className="primary-button" onClick={requestCamera}><Camera size={17}/>{cameraRequested?"Caméra détectée":"Tester la caméra"}</button><span className="micro-note">{cameraRequested?"Autorisation caméra accordée":"Aucune capture n'est conservée"}</span></div></div><Suspense fallback={<div className="scene3d scene3d-loading" aria-label="Chargement de la scène 3D"><span className="scene3d-label">INITIALISATION 3D…</span></div>}><Scene3D /></Suspense></section>
<div className="section-heading"><div><span className="eyebrow">ARCHITECTURE MODULAIRE</span><h3>Modules OREL</h3></div><span className="muted">Fondations · Jour 1</span></div><section className="module-grid">{modules.map(({name,detail,icon:Icon,status})=><article className="module-card" key={name}><div className="module-icon"><Icon size={19}/></div><div className="module-title">{name}</div><p>{detail}</p><span className={status==="prototype"?"module-status prototype":"module-status"}>{status==="prototype"?"Socle visuel":"À développer"}</span></article>)}</section><footer><span>OREL V0.1.0 · FOUNDATION</span><span>Windows first · Android-ready architecture</span></footer></section></main>;
}