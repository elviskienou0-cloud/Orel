import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

async function loadTs(path, names) {
  const source = await readFile(new URL("../" + path, import.meta.url), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
  }).outputText;
  const module = await import("data:text/javascript;base64," + Buffer.from(output).toString("base64"));
  return Object.fromEntries(names.map((name) => [name, module[name]]));
}

const { parseMissionPlan, isMissionPlan } = await loadTs("src/lib/missions.ts", ["parseMissionPlan", "isMissionPlan"]);
const plan = parseMissionPlan(JSON.stringify({
  title: "Préparer un dossier",
  summary: "Organiser les éléments du dossier.",
  steps: ["Lister les documents", "Classer les fichiers", "Vérifier le résultat"]
}));
assert.equal(plan.steps.length, 3);
assert.throws(() => parseMissionPlan("{"), /JSON valide/);
assert.throws(() => parseMissionPlan(JSON.stringify({ title: "x", summary: "", steps: ["une seule étape"] })), /2 à 8 étapes/);
assert.equal(isMissionPlan({ id: "1", title: "x", summary: "y", steps: ["a", "b"], completed: [0], createdAt: Date.now() }), true);
assert.equal(isMissionPlan({ id: "1", title: "x", summary: "y", steps: ["a", "b"], completed: [3], createdAt: Date.now() }), false);

const { analyzeScreenWithOllama } = await loadTs("src/lib/ollama.ts", ["analyzeScreenWithOllama"]);
await assert.rejects(
  analyzeScreenWithOllama({ endpoint: "https://example.com", model: "vision" }, "Décris", "aGVsbG8="),
  /serveur Ollama local/
);
await assert.rejects(
  analyzeScreenWithOllama({ endpoint: "http://localhost:11434", model: "vision" }, "Décris", "not base64!"),
  /capture d'écran est invalide/
);
console.log("6 OREL Phase 2 validation checks passed.");
