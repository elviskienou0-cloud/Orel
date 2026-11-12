export type MissionPlan = {
  id: string;
  title: string;
  summary: string;
  steps: string[];
  completed: number[];
  createdAt: number;
};

export function parseMissionPlan(raw: string): { title: string; summary: string; steps: string[] } {
  let value: unknown;
  try { value = JSON.parse(raw); } catch { throw new Error("OREL n'a pas renvoyé un plan JSON valide."); }
  if (typeof value !== "object" || value === null) throw new Error("Format de plan invalide.");
  const record = value as Record<string, unknown>;
  if (typeof record.title !== "string" || !record.title.trim() || record.title.length > 120 ||
      typeof record.summary !== "string" || record.summary.length > 500 ||
      !Array.isArray(record.steps) || record.steps.length < 2 || record.steps.length > 8 ||
      !record.steps.every((step) => typeof step === "string" && step.trim().length > 0 && step.length <= 240)) {
    throw new Error("Le plan doit contenir un titre, un résumé et 2 à 8 étapes courtes.");
  }
  return { title: record.title.trim(), summary: record.summary.trim(), steps: record.steps.map((step) => (step as string).trim()) };
}

export function isMissionPlan(value: unknown): value is MissionPlan {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  if (typeof item.id !== "string" || typeof item.title !== "string" ||
      typeof item.summary !== "string" || !Array.isArray(item.steps) ||
      item.steps.length < 2 || item.steps.length > 8 ||
      !item.steps.every((step) => typeof step === "string") ||
      !Array.isArray(item.completed) ||
      typeof item.createdAt !== "number" || !Number.isFinite(item.createdAt)) return false;
  const steps = item.steps as unknown[];
  const completed = item.completed as unknown[];
  return completed.every((step) => Number.isInteger(step) && (step as number) >= 0 && (step as number) < steps.length);
}

export function loadMissionPlan(): MissionPlan | null {
  try {
    const raw = localStorage.getItem("orel.mission-plan.v1");
    if (!raw) return null;
    const value: unknown = JSON.parse(raw);
    return isMissionPlan(value) ? value : null;
  } catch { return null; }
}

export function saveMissionPlan(plan: MissionPlan | null): void {
  try {
    if (plan) localStorage.setItem("orel.mission-plan.v1", JSON.stringify(plan));
    else localStorage.removeItem("orel.mission-plan.v1");
  } catch { /* Local storage is optional. */ }
}
