import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/gestures.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const { classifyGesture } = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

function hand() {
  return Array.from({ length: 21 }, () => ({ x: 0.5, y: 0.5, z: 0 }));
}
function finger(points, tip, pip, extended, x) {
  points[pip] = { x, y: extended ? 0.45 : 0.65, z: 0 };
  points[tip] = { x, y: extended ? 0.2 : 0.8, z: 0 };
}
function setClosedThumb(points) {
  points[3] = { x: 0.42, y: 0.58, z: 0 };
  points[4] = { x: 0.44, y: 0.58, z: 0 };
  points[5] = { x: 0.45, y: 0.58, z: 0 };
}
function setOpenThumb(points) {
  points[3] = { x: 0.35, y: 0.55, z: 0 };
  points[4] = { x: 0.2, y: 0.4, z: 0 };
  points[5] = { x: 0.4, y: 0.6, z: 0 };
}
function setFingers(points, states) {
  finger(points, 8, 6, states[0], 0.4);
  finger(points, 12, 10, states[1], 0.47);
  finger(points, 16, 14, states[2], 0.55);
  finger(points, 20, 18, states[3], 0.63);
}

const openPalm = hand(); setFingers(openPalm, [true,true,true,true]); setOpenThumb(openPalm);
const fist = hand(); setFingers(fist, [false,false,false,false]); setClosedThumb(fist);
const point = hand(); setFingers(point, [true,false,false,false]); setClosedThumb(point);
const victory = hand(); setFingers(victory, [true,true,false,false]); setClosedThumb(victory);
const pinch = hand(); setFingers(pinch, [true,false,false,false]); setClosedThumb(pinch); pinch[4] = {x:0.5,y:0.2,z:0}; pinch[8] = {x:0.51,y:0.2,z:0};

assert.equal(classifyGesture(openPalm), "open_palm", "open palm should be recognized");
assert.equal(classifyGesture(fist), "fist", "closed fist should be recognized");
assert.equal(classifyGesture(point), "point", "index pointing should be recognized");
assert.equal(classifyGesture(victory), "victory", "two-finger gesture should be recognized");
assert.equal(classifyGesture(pinch), "pinch", "thumb-index pinch should be recognized");
assert.equal(classifyGesture(pinch, 0.005), "point", "a tighter pinch threshold should reject a wider pinch");
assert.equal(classifyGesture(pinch, 0.02), "pinch", "a wider pinch threshold should accept the same pinch");
assert.equal(classifyGesture(hand().slice(0, 20)), "unknown", "incomplete landmarks should be ignored");

console.log("8 gesture classification checks passed.");
