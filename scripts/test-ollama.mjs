import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import ts from "typescript";

const source = await readFile(new URL("../src/lib/ollama.ts", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
}).outputText;
const ollama = await import("data:text/javascript;base64," + Buffer.from(compiled).toString("base64"));

const originalFetch = globalThis.fetch;
try {
  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /\/api\/tags$/);
    assert.equal(init.method, "GET");
    return new Response(JSON.stringify({ models: [{ name: "qwen2.5:3b" }, { name: "llama3.2:3b" }] }), { status: 200 });
  };
  const models = await ollama.checkOllama({ endpoint: "http://localhost:11434/", model: "qwen2.5:3b" });
  assert.deepEqual(models, ["qwen2.5:3b", "llama3.2:3b"]);

  globalThis.fetch = async (url, init) => {
    assert.match(String(url), /\/api\/chat$/);
    const body = JSON.parse(init.body);
    assert.equal(body.model, "qwen2.5:3b");
    assert.equal(body.messages.at(-1).content, "Bonjour");
    return new Response(JSON.stringify({ message: { content: "Bonjour." } }), { status: 200 });
  };
  const answer = await ollama.askOllama(
    { endpoint: "http://localhost:11434", model: "qwen2.5:3b" },
    [],
    "Bonjour"
  );
  assert.equal(answer, "Bonjour.");

  globalThis.fetch = async (_url, init) => {
    const body = JSON.parse(init.body);
    const history = body.messages.slice(1, -1);
    assert.ok(history.length <= 12);
    assert.ok(history.reduce((sum, item) => sum + item.content.length, 0) <= 12_000);
    return new Response(JSON.stringify({ message: { content: "Contexte compacté." } }), { status: 200 });
  };
  const compactedAnswer = await ollama.askOllama(
    { endpoint: "http://localhost:11434", model: "qwen2.5:3b" },
    Array.from({ length: 12 }, (_, index) => ({
      id: String(index), role: index % 2 ? "assistant" : "user", content: "x".repeat(5000), createdAt: index
    })),
    "Dernière question"
  );
  assert.equal(compactedAnswer, "Contexte compacté.");

  await assert.rejects(
    () => ollama.checkOllama({ endpoint: "file:///etc/passwd", model: "x" }),
    /serveur Ollama local/
  );
  await assert.rejects(
    () => ollama.checkOllama({ endpoint: "https://example.com", model: "x" }),
    /serveur Ollama local/
  );
} finally {
  globalThis.fetch = originalFetch;
}
console.log("5 Ollama adapter checks passed.");
