interface RecognitionResult {
  0: { transcript: string };
  isFinal: boolean;
}
interface RecognitionEvent {
  results: ArrayLike<RecognitionResult>;
}
interface RecognitionErrorEvent {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: RecognitionEvent) => void) | null;
  onerror: ((event: RecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}
interface SpeechRecognitionConstructor {
  new (): SpeechRecognitionLike;
}
type SpeechWindow = Window & {
  SpeechRecognition?: SpeechRecognitionConstructor;
  webkitSpeechRecognition?: SpeechRecognitionConstructor;
};

export function speak(text: string): boolean {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "fr-FR";
  utterance.rate = 1;
  utterance.pitch = 1;
  window.speechSynthesis.speak(utterance);
  return true;
}

export function listenOnce(
  onText: (text: string) => void,
  onError: (message: string) => void
): (() => void) | null {
  const speechWindow = window as SpeechWindow;
  const Recognition = speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
  if (!Recognition) {
    onError("La reconnaissance vocale n'est pas disponible dans ce navigateur. Essaie Chrome ou Edge.");
    return null;
  }

  const recognition = new Recognition();
  recognition.lang = "fr-FR";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;
  recognition.onresult = (event) => {
    const result = event.results[0];
    if (result?.[0]?.transcript) onText(result[0].transcript.trim());
  };
  recognition.onerror = (event) => {
    onError(event.error === "not-allowed"
      ? "Accès au microphone refusé. Autorise-le dans le navigateur."
      : `Erreur microphone : ${event.error}`);
  };
  try {
    recognition.start();
  } catch {
    onError("Impossible de démarrer le microphone. Réessaie dans quelques secondes.");
    return null;
  }
  return () => recognition.abort();
}
