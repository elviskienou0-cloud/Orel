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
  if ((parsed.protocol !== "http:" && parsed.protocol !== "https:") ||
      parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error("Utilise une adresse HTTP(S) sans identifiant, paramètre ni fragment.");
  }
  return endpoint;
}

async function fetchWithTimeout(
  url: string,
  init: RequestInit,
  externalSignal: AbortSignal | undefined,
  timeoutMs: number
): Promise<Response> {
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
    return await fetch(url, { ...init, signal: controller.signal });
  } catch (error) {
    if (timedOut) throw new Error("Le serveur Ollama n'a pas répondu dans le délai imparti.");
    throw error;
  } finally {
    clearTimeout(timeout);
    externalSignal?.removeEventListener("abort", abortFromCaller);
  }
}

export async function checkOllama(config: OllamaConfig, signal?: AbortSignal): Promise<string[]> {
  const endpoint = getEndpoint(config);
  const response = await fetchWithTimeout(endpoint + "/api/tags", { method: "GET" }, signal, 8_000);
  if (!response.ok) throw new Error("Ollama a répondu avec le statut " + response.status + ".");
  const data: unknown = await response.json();
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

  const response = await fetchWithTimeout(
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
          ...history.slice(-12).map((message) => ({
            role: message.role === "assistant" ? "assistant" : "user",
            content: message.content
          })),
          { role: "user", content: prompt }
        ]
      })
    },
    signal,
    120_000
  );

  if (!response.ok) {
    throw new Error("Le serveur IA a répondu avec le statut " + response.status + ". Vérifie Ollama, le modèle et les autorisations réseau du navigateur.");
  }
  const data: unknown = await response.json();
  if (typeof data !== "object" || data === null || !("message" in data)) {
    throw new Error("Réponse inattendue du serveur IA.");
  }
  const message = (data as { message?: { content?: unknown } }).message;
  if (typeof message?.content !== "string" || !message.content.trim()) {
    throw new Error("Le modèle IA n'a pas renvoyé de réponse.");
  }
  return message.content.trim();
}