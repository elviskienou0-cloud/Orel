import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/command-router.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const { parseDesktopCommand } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

assert.deepEqual(parseDesktopCommand("Ouvre la calculatrice"), {
  kind: "open-app", appId: "calculator", label: "Calculatrice"
});
assert.deepEqual(parseDesktopCommand("OREL, lance le bloc-notes !"), {
  kind: "open-app", appId: "notepad", label: "Bloc-notes"
});
assert.deepEqual(parseDesktopCommand("Démarre l'explorateur de fichiers"), {
  kind: "open-app", appId: "explorer", label: "Explorateur de fichiers"
});
assert.equal(parseDesktopCommand("ouvre le navigateur"), null);
assert.equal(parseDesktopCommand("ouvre la calculatrice et cherche un calcul"), null);
assert.equal(parseDesktopCommand(""), null);
console.log("6 desktop command routing checks passed.");
