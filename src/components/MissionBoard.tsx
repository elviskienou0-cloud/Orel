import { useState } from "react";
import { CheckCircle2, ClipboardList, ListChecks, RotateCcw, Sparkles } from "lucide-react";
import { planMissionWithOllama, type OllamaConfig } from "../lib/ollama";
import { loadMissionPlan, parseMissionPlan, saveMissionPlan, type MissionPlan } from "../lib/missions";

type Props = { config: OllamaConfig };

export default function MissionBoard({ config }: Props) {
  const [objective, setObjective] = useState("");
  const [plan, setPlan] = useState<MissionPlan | null>(() => loadMissionPlan());
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");

  async function createPlan() {
    if (!objective.trim() || busy) return;
    setBusy(true);
    setNotice("OREL prépare un plan. Aucune action Windows n'est exécutée.");
    try {
      const raw = await planMissionWithOllama(config, objective.trim());
      const parsed = parseMissionPlan(raw);
      const next: MissionPlan = { ...parsed, id: String(Date.now()), completed: [], createdAt: Date.now() };
      setPlan(next);
      saveMissionPlan(next);
      setNotice("Plan créé et enregistré localement.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Impossible de créer le plan.");
    } finally { setBusy(false); }
  }

  function toggleStep(index: number) {
    if (!plan) return;
    const completed = plan.completed.includes(index)
      ? plan.completed.filter((item) => item !== index)
      : [...plan.completed, index];
    const next = { ...plan, completed };
    setPlan(next);
    saveMissionPlan(next);
  }

  function clearPlan() {
    setPlan(null);
    saveMissionPlan(null);
    setNotice("Plan supprimé de la mémoire locale.");
  }

  return (
    <section className="workspace mission-board">
      <div className="panel-heading"><div><span className="eyebrow">AGENT DE PLANIFICATION</span><h2>Préparer une mission</h2></div><ClipboardList size={22}/></div>
      <p className="panel-description">Décris un objectif. OREL demande à Ollama de le décomposer en étapes, puis conserve leur progression sur cet appareil. Cette version planifie et suit les étapes : elle ne les exécute pas automatiquement.</p>
      <label className="mission-objective">Objectif de la mission
        <textarea value={objective} onChange={(event) => setObjective(event.target.value)} maxLength={3000} rows={3} placeholder="Ex. : préparer un dossier de présentation et organiser les fichiers nécessaires."/>
      </label>
      <div className="mission-actions">
        <button className="primary-button" disabled={!objective.trim() || busy} onClick={() => void createPlan()}><Sparkles size={16}/>{busy ? "Planification…" : "Créer le plan"}</button>
        {plan && <button className="secondary-button" onClick={clearPlan}><RotateCcw size={15}/> Effacer le plan</button>}
      </div>
      {notice && <p className="notice" role="status">{notice}</p>}
      {plan && <div className="mission-result">
        <div className="mission-result-heading"><div><span className="eyebrow">MISSION ACTIVE</span><h3>{plan.title}</h3></div><strong>{plan.completed.length}/{plan.steps.length}</strong></div>
        <p>{plan.summary}</p>
        <div className="mission-progress"><span style={{ width: (plan.completed.length / plan.steps.length * 100) + "%" }}/></div>
        <ol className="mission-steps">{plan.steps.map((step, index) => <li key={index}><label><input type="checkbox" checked={plan.completed.includes(index)} onChange={() => toggleStep(index)}/><span>{step}</span></label>{plan.completed.includes(index) && <CheckCircle2 size={16}/>}</li>)}</ol>
        <small>Progression cochée manuellement. Les étapes ne déclenchent aucune commande sur l'ordinateur.</small>
      </div>}
      <p className="vision-privacy">Utilise un modèle Ollama local. La qualité du plan dépend du modèle sélectionné. Vérifie les étapes avant de les suivre.</p>
    </section>
  );
}
