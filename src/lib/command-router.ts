export type DesktopCommand = {
  kind: "open-app";
  appId: "notepad" | "calculator" | "explorer";
  label: string;
};

function normalizeCommand(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("fr-FR")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parse only complete, explicitly supported desktop commands.
 * Unknown or compound requests are left to the conversational assistant.
 */
export function parseDesktopCommand(input: string): DesktopCommand | null {
  const value = normalizeCommand(input);
  if (!value) return null;

  const match = value.match(/^(?:orel[, ]+)?(?:ouvre|ouvrir|lance|lancer|demarre|demarrer) (?:moi )?(?:la |le |l'|l’)?(.+)$/);
  if (!match) return null;

  const target = match[1].replace(/^l['’]/, "").trim();
  if (/^(?:calculatrice|calculator)$/.test(target)) {
    return { kind: "open-app", appId: "calculator", label: "Calculatrice" };
  }
  if (/^(?:bloc notes|bloc-notes|notepad)$/.test(target)) {
    return { kind: "open-app", appId: "notepad", label: "Bloc-notes" };
  }
  if (/^(?:explorateur|explorateur de fichiers|fichiers|explorer)$/.test(target)) {
    return { kind: "open-app", appId: "explorer", label: "Explorateur de fichiers" };
  }
  return null;
}
