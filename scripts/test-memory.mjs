import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/memory.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const memory = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

const messages = [
  { id: "a", role: "user", content: "Bonjour", createdAt: 1 },
  { id: "b", role: "assistant", content: "Bonjour. Comment aider ?", createdAt: 2 }
];
const backup = memory.exportMessages(messages);
const restored = memory.importMessages(backup);
assert.equal(restored.length, 2);
assert.equal(restored[0].content, "Bonjour");
assert.throws(() => memory.importMessages("{invalid"), /JSON valide/);
assert.throws(() => memory.importMessages(JSON.stringify({ format: "other", version: 1, messages })), /pas une sauvegarde/);
assert.throws(() => memory.importMessages(JSON.stringify({ format: "orel-memory", version: 1, messages: [] })), /Aucun message valide/);
console.log("5 memory import/export checks passed.");