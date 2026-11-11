import { invoke, isTauri } from "@tauri-apps/api/core";

export const allowedDesktopApps = [
  { id: "notepad", label: "Bloc-notes" },
  { id: "calculator", label: "Calculatrice" },
  { id: "explorer", label: "Explorateur de fichiers" }
] as const;

export type AllowedDesktopApp = typeof allowedDesktopApps[number]["id"];

export function isDesktopRuntime(): boolean {
  return isTauri();
}

export async function openAllowedApp(appId: AllowedDesktopApp): Promise<void> {
  if (!isTauri()) {
    throw new Error("Cette action nécessite l'application Windows OREL installée.");
  }
  await invoke("open_allowed_app", { appId });
}