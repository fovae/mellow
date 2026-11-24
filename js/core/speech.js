import { getState } from "./store.js";
import { languageCode } from "../data/languages.js";

const RATES = { slow: 0.65, normal: 0.9, fast: 1.1 };

export const canSpeak = () => "speechSynthesis" in window;

export function speak(text, language) {
    if (!canSpeak()) return;
    const code = languageCode(language);
    const utterance = new SpeechSynthesisUtterance(text.replace(/\s*\(.*?\)/g, ""));
    utterance.lang = code;
    const voice = speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").startsWith(code));
    if (voice) utterance.voice = voice;
    utterance.rate = RATES[getState().settings.speechRate] ?? RATES.normal;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
}
