export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

const STORAGE_KEY = "orel.memory.v1";
const MAX_MESSAGES = 100;
const MAX_MESSAGE_LENGTH = 12_000;
const MAX_IMPORT_LENGTH = 2_000_000;

function isChatMessage(value: unknown): value is ChatMessage {
  if (typeof value !== "object" || value === null) return false;
  const item = value as Record<string, unknown>;
  return typeof item.id === "string" && item.id.length > 0 && item.id.length <= 128 &&
    (item.role === "user" || item.role === "assistant") &&
    typeof item.content === "string" && item.content.length <= MAX_MESSAGE_LENGTH &&
    typeof item.createdAt === "number" && Number.isFinite(item.createdAt) && item.createdAt >= 0;
}

function normalizeMessages(value: unknown): ChatMessage[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isChatMessage).slice(-MAX_MESSAGES);
}

export function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeMessages(JSON.parse(raw) as unknown);
  } catch {
    return [];
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeMessages(messages)));
  } catch {
    // Storage can be disabled or full. The current conversation still works in memory.
  }
}

export function clearMessages(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage restrictions.
  }
}

export function exportMessages(messages: ChatMessage[]): string {
  return JSON.stringify({
    format: "orel-memory",
    version: 1,
    exportedAt: new Date().toISOString(),
    messages: normalizeMessages(messages)
  }, null, 2);
}

export function importMessages(raw: string): ChatMessage[] {
  if (raw.length > MAX_IMPORT_LENGTH) {
    throw new Error("Le fichier dépasse la taille maximale autorisée (2 Mo).");
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw) as unknown;
  } catch {
    throw new Error("Le fichier de mémoire n'est pas un JSON valide.");
  }
  if (typeof parsed !== "object" || parsed === null || !("format" in parsed) ||
      (parsed as { format?: unknown }).format !== "orel-memory" ||
      !("version" in parsed) || (parsed as { version?: unknown }).version !== 1 ||
      !("messages" in parsed)) {
    throw new Error("Ce fichier n'est pas une sauvegarde OREL reconnue.");
  }
  const messages = normalizeMessages((parsed as { messages: unknown }).messages);
  if (messages.length === 0) throw new Error("Aucun message valide n'a été trouvé dans cette sauvegarde.");
  return messages;
}