import type { ChatMessage } from "./memory";

export interface OllamaConfig {
  endpoint: string;
  model: string;
}

export async function askOllama(
  config: OllamaConfig,
  history: ChatMessage[],
  userMessage: string
): Promise<string> {
  const endpoint = config.endpoint.trim().replace(/\/$/, "");
  const model = config.model.trim();
  if (!endpoint || !model) throw new Error("Renseigne l'adresse du serveur et le nom du modèle.");
  let parsed: URL;
  try {
    parsed = new URL(endpoint);
  } catch {
    throw new Error("L'adresse du serveur IA n'est pas valide.");
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Le serveur IA doit utiliser HTTP ou HTTPS.");
  }

  const response = await fetch(`${endpoint}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        {
          role: "system",
          content: "Tu es OREL, un assistant personnel. Réponds en français par défaut, clairement et honnêtement. N'affirme jamais avoir effectué une action sur l'ordinateur si aucun outil autorisé ne l'a réellement exécutée. Demande confirmation avant toute action sensible."
        },
        ...history.slice(-10).map((message) => ({
          role: message.role === "assistant" ? "assistant" : "user",
          content: message.content
        })),
        { role: "user", content: userMessage }
      ]
    })
  });

  if (!response.ok) {
    throw new Error(`Le serveur IA a répondu avec le statut ${response.status}. Vérifie qu'Ollama fonctionne et autorise l'accès depuis le navigateur.`);
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
