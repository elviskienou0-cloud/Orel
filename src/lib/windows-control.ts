import { invoke, isTauri } from "@tauri-apps/api/core";

export type WindowsScreenSize = { width: number; height: number };

function requireDesktop(): void {
  if (!isTauri()) {
    throw new Error("Le contrôle global nécessite l'application OREL installée sur Windows.");
  }
}

export async function getWindowsScreenSize(): Promise<WindowsScreenSize> {
  requireDesktop();
  return invoke<WindowsScreenSize>("get_screen_size");
}

export async function moveWindowsPointer(x: number, y: number): Promise<void> {
  requireDesktop();
  await invoke("move_mouse", { x, y });
}

export async function setWindowsLeftButton(pressed: boolean): Promise<void> {
  requireDesktop();
  await invoke("set_left_mouse_button", { pressed });
}

export async function scrollWindows(delta: number): Promise<void> {
  requireDesktop();
  await invoke("scroll_mouse", { delta });
}
