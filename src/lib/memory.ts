export type ChatRole = "user" | "assistant";
export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  createdAt: number;
}

const STORAGE_KEY = "orel.memory.v1";
const MAX_MESSAGES = 100;

export function loadMessages(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is ChatMessage =>
      typeof item === "object" &&
      item !== null &&
      (item as ChatMessage).role !== undefined &&
      ((item as ChatMessage).role === "user" || (item as ChatMessage).role === "assistant") &&
      typeof (item as ChatMessage).content === "string" &&
      typeof (item as ChatMessage).createdAt === "number" &&
      typeof (item as ChatMessage).id === "string"
    ).slice(-MAX_MESSAGES);
  } catch {
    return [];
  }
}

export function saveMessages(messages: ChatMessage[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.slice(-MAX_MESSAGES)));
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
