import { languageCode } from "../data/languages.js";

export const canSpeak = () => "speechSynthesis" in window;

export function speak(text, language) {
    if (!canSpeak()) return;
    const code = languageCode(language);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = code;
    const voice = speechSynthesis.getVoices().find((v) => v.lang.replace("_", "-").startsWith(code));
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    speechSynthesis.cancel();
    speechSynthesis.speak(utterance);
}
