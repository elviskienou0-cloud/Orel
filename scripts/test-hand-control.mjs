import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/hand-control.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const { mapHandToScreen, smoothPointer } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

assert.deepEqual(mapHandToScreen({ x: 0.5, y: 0.5 }, { width: 1920, height: 1080 }), { x: 960, y: 540 });
assert.deepEqual(mapHandToScreen({ x: 0, y: 0 }, { width: 1920, height: 1080 }), { x: 0, y: 0 });
assert.deepEqual(mapHandToScreen({ x: 1, y: 1 }, { width: 1920, height: 1080 }), { x: 1919, y: 1079 });
assert.deepEqual(mapHandToScreen({ x: 0.5, y: 0.5 }, { width: 0, height: 0 }), { x: 0, y: 0 });
assert.deepEqual(smoothPointer(null, { x: 0.2, y: 0.4 }), { x: 0.2, y: 0.4 });
const smooth = smoothPointer({ x: 0.2, y: 0.4 }, { x: 0.8, y: 0.6 }, 0.5);
assert.deepEqual(smooth, { x: 0.5, y: 0.5 });
const lowSensitivity = mapHandToScreen({ x: 0.9, y: 0.9 }, { width: 1000, height: 1000 }, 0.7);
const highSensitivity = mapHandToScreen({ x: 0.9, y: 0.9 }, { width: 1000, height: 1000 }, 1.6);
assert.ok(highSensitivity.x > lowSensitivity.x);
assert.ok(highSensitivity.y > lowSensitivity.y);

console.log("8 Windows hand-control mapping and smoothing checks passed.");
