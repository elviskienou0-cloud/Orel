import type { ChatMessage } from "./memory";

export interface OllamaConfig {
  endpoint: string;
  model: string;
}

function getEndpoint(config: OllamaConfig): string {
  const endpoint = config.endpoint.trim().replace(/\/+$/, "");
  if (!endpoint || !config.model.trim()) {
    throw new Error("Renseigne l'adresse du serveur et le nom du modèle.");
  }
  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error("L'adresse du serveur IA n'est pas valide.");
  }
  const localHosts = new Set(["localhost", "127.0.0.1", "[::1]"]);
  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      !localHosts.has(parsed.hostname) ||
      parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("Pour protéger tes conversations, OREL accepte uniquement un serveur Ollama local (localhost ou 127.0.0.1), sans identifiant ni paramètre.");
  }
  return endpoint;
}

async function fetchJsonWithTimeout(
  url: string,
  init: RequestInit,
  externalSignal: AbortSignal | undefined,
  timeoutMs: number
): Promise<{ response: Response; data: unknown }> {
  const controller = new AbortController();
  let timedOut = false;
  const abortFromCaller = () => controller.abort();
  if (externalSignal?.aborted) controller.abort();
  else externalSignal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    if (!response.ok) return { response, data: null };
    const data: unknown = await response.json();
    return { response, data };
  } catch (error) {
    if (timedOut) throw new Error("Le serveur Ollama n'a pas répondu dans le délai imparti.");
    throw error;
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromCaller);
  }
}

function compactHistory(history: ChatMessage[]): Array<{ role: "user" | "assistant"; content: string }> {
  let remaining = 12_000;
  const compacted: Array<{ role: "user" | "assistant"; content: string }> = [];
  for (const message of history.slice(-12).reverse()) {
    if (remaining <= 0) break;
    const content = message.content.slice(-Math.min(3_000, remaining));
    if (!content) continue;
    compacted.unshift({
      role: message.role === "assistant" ? "assistant" : "user",
      content
    });
    remaining -= content.length;
  }
  return compacted;
}

export async function checkOllama(config: OllamaConfig, signal?: AbortSignal): Promise<string[]> {
  const endpoint = getEndpoint(config);
  const result = await fetchJsonWithTimeout(endpoint + "/api/tags", { method: "GET" }, signal, 8_000);
  if (!result.response.ok) {
    throw new Error("Ollama a répondu avec le statut " + result.response.status + ".");
  }
  const data = result.data;
  if (typeof data !== "object" || data === null || !("models" in data) ||
      !Array.isArray((data as { models?: unknown }).models)) {
    throw new Error("Réponse inattendue du serveur Ollama.");
  }
  return (data as { models: Array<{ name?: unknown }> }).models
    .map((model) => model?.name)
    .filter((name): name is string => typeof name === "string");
}

export async function askOllama(
  config: OllamaConfig,
  history: ChatMessage[],
  userMessage: string,
  signal?: AbortSignal
): Promise<string> {
  const endpoint = getEndpoint(config);
  const model = config.model.trim();
  const prompt = userMessage.trim();
  if (!prompt) throw new Error("Le message est vide.");
  if (prompt.length > 20_000) throw new Error("Le message dépasse la limite de 20 000 caractères.");

  const result = await fetchJsonWithTimeout(
    endpoint + "/api/chat",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          {
            role: "system",
            content: "Tu es OREL, un assistant personnel. Réponds en français par défaut, clairement et honnêtement. Distingue les faits vérifiés des hypothèses. N'affirme jamais avoir effectué une action sur l'ordinateur si aucun outil autorisé ne l'a réellement exécutée. Ne demande jamais de secrets, mots de passe ou clés privées. Demande confirmation avant toute action sensible."
          },
          ...compactHistory(history),
          { role: "user", content: prompt }
        ]
      })
    },
    signal,
    120_000
  );

  if (!result.response.ok) {
    throw new Error("Le serveur IA a répondu avec le statut " + result.response.status + ". Vérifie Ollama, le modèle et les autorisations réseau du navigateur.");
  }
  const data = result.data;
  if (typeof data !== "object" || data === null || !("message" in data)) {
    throw new Error("Réponse inattendue du serveur Ollama.");
  }
  const message = (data as { message?: { content?: unknown } }).message;
  if (typeof message?.content !== "string" || !message.content.trim()) {
    throw new Error("Le modèle IA n'a pas renvoyé de réponse.");
  }
  return message.content.trim();
}

export async function analyzeScreenWithOllama(
  config: OllamaConfig,
  question: string,
  imageBase64: string,
  signal?: AbortSignal
): Promise<string> {
  const endpoint = getEndpoint(config);
  const prompt = question.trim();
  if (!prompt || prompt.length > 1_200) throw new Error("La consigne doit contenir entre 1 et 1 200 caractères.");
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(imageBase64) || imageBase64.length > 5_500_000) {
    throw new Error("La capture d'écran est invalide ou trop volumineuse.");
  }
  const result = await fetchJsonWithTimeout(endpoint + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model.trim(),
      stream: false,
      messages: [
        { role: "system", content: "Tu es OREL. Analyse uniquement l'image fournie. Réponds en français, décris les éléments visibles, distingue clairement ce que tu lis de ce que tu déduis. Ne prétends pas avoir cliqué, modifié ou exécuté quoi que ce soit." },
        { role: "user", content: prompt, images: [imageBase64] }
      ]
    })
  }, signal, 120_000);
  if (!result.response.ok) {
    throw new Error("Ollama a répondu avec le statut " + result.response.status + ". Vérifie qu'un modèle vision est installé et sélectionné.");
  }
  const data = result.data;
  if (typeof data !== "object" || data === null || !("message" in data)) {
    throw new Error("Réponse inattendue du modèle vision Ollama.");
  }
  const content = (data as { message?: { content?: unknown } }).message?.content;
  if (typeof content !== "string" || !content.trim()) {
    throw new Error("Le modèle n'a pas renvoyé d'analyse. Le modèle sélectionné ne prend peut-être pas en charge les images.");
  }
  return content.trim();
}

export async function planMissionWithOllama(
  config: OllamaConfig,
  objective: string,
  signal?: AbortSignal
): Promise<string> {
  const endpoint = getEndpoint(config);
  const prompt = objective.trim();
  if (!prompt || prompt.length > 3_000) throw new Error("L'objectif doit contenir entre 1 et 3 000 caractères.");
  const result = await fetchJsonWithTimeout(endpoint + "/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: config.model.trim(),
      stream: false,
      format: "json",
      messages: [
        { role: "system", content: "Tu es le planificateur d'OREL. Décompose l'objectif en 2 à 8 étapes concrètes et ordonnées. Ne prétends jamais exécuter une étape. N'inclus aucune commande shell, aucun script et aucune action destructive. Réponds uniquement en JSON avec les clés title, summary et steps, où steps est un tableau de chaînes courtes." },
        { role: "user", content: "Prépare un plan pour cet objectif : " + prompt }
      ]
    })
  }, signal, 120_000);
  if (!result.response.ok) throw new Error("Ollama a répondu avec le statut " + result.response.status + ".");
  const data = result.data;
  if (typeof data !== "object" || data === null || !("message" in data)) throw new Error("Réponse inattendue du planificateur Ollama.");
  const content = (data as { message?: { content?: unknown } }).message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("Le planificateur n'a pas renvoyé de plan.");
  return content.trim();
}
