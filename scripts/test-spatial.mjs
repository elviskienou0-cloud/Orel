import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/spatial.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const spatial = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

const positions = {
  assistant: { x: 0.05, y: 0.05 },
  memory: { x: 0.65, y: 0.05 },
  vision: { x: 0.3, y: 0.6 }
};
assert.equal(spatial.findPanelAtPoint(100, 100, 1000, 600, positions), "assistant");
assert.equal(spatial.findPanelAtPoint(750, 100, 1000, 600, positions), "memory");
assert.equal(spatial.findPanelAtPoint(500, 400, 1000, 600, positions), "vision");
assert.equal(spatial.findPanelAtPoint(950, 550, 1000, 600, positions), null);
const moved = spatial.movePanelToPointer(990, 590, 1000, 600, 10, 10);
assert.ok(moved.x <= 1 - spatial.SPATIAL_PANEL_WIDTH / 1000);
assert.ok(moved.y <= 1 - spatial.SPATIAL_PANEL_HEIGHT / 600);
assert.deepEqual(spatial.movePanelToPointer(10, 10, 0, 0, 0, 0), { x: 0, y: 0 });
console.log("6 spatial panel interaction checks passed.");
