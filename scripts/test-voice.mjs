import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/voice.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const voice = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

let spoken;
let speakCalls = 0;
let cancelCalls = 0;
globalThis.SpeechSynthesisUtterance = class {
  constructor(text) { this.text = text; this.lang = ""; this.rate = 1; this.pitch = 1; this.onend = null; this.onerror = null; }
};
globalThis.window = {
  speechSynthesis: {
    cancel() { cancelCalls += 1; },
    speak(utterance) { spoken = utterance; speakCalls += 1; }
  }
};
let finished = 0;
assert.equal(voice.speak("Bonjour OREL", () => { finished += 1; }), true);
assert.equal(spoken.text, "Bonjour OREL");
assert.equal(spoken.lang, "fr-FR");
assert.equal(speakCalls, 1);
assert.equal(cancelCalls, 1);
spoken.onend();
spoken.onerror();
assert.equal(finished, 1, "speech completion callback must run only once");

let recognition;
let transcript = "";
let ended = 0;
globalThis.window.SpeechRecognition = class {
  constructor() { recognition = this; }
  start() { this.started = true; }
  stop() {}
  abort() { this.aborted = true; }
};
const cancel = voice.listenOnce((value) => { transcript = value; }, () => assert.fail("unexpected recognition error"), () => { ended += 1; });
assert.equal(recognition.started, true);
recognition.onresult({ results: [{ 0: { transcript: "  Bonjour OREL  " } }] });
recognition.onend();
assert.equal(transcript, "Bonjour OREL");
assert.equal(ended, 1);
assert.equal(typeof cancel, "function");

let errorMessage = "";
let errorEnded = 0;
const cancelOnError = voice.listenOnce(() => {}, (message) => { errorMessage = message; }, () => { errorEnded += 1; });
recognition.onerror({ error: "not-allowed" });
assert.match(errorMessage, /microphone refusé/);
assert.equal(errorEnded, 1);
assert.equal(typeof cancelOnError, "function");

delete globalThis.window.SpeechRecognition;
const stop = voice.listenOnce(() => {}, () => {}, () => {});
assert.equal(stop, null);

console.log("Voice speech output, recognition lifecycle, errors and unsupported-browser checks passed.");
