// Short tones made on the device: no audio files. Vibration where supported.
import { getState } from "./store.js";

const tunes = { right: [[660, 0], [880, 0.08]], wrong: [[220, 0]], done: [[523, 0], [659, 0.1], [784, 0.2], [1047, 0.3]] };
let context = null;

export function play(name) {
    const { sound } = getState().settings;
    if (!sound) return;
    navigator.vibrate?.(name === "wrong" ? 40 : 12);
    try {
        context ??= new (window.AudioContext ?? window.webkitAudioContext)();
        context.resume?.();
        for (const [frequency, delay] of tunes[name]) {
            const start = context.currentTime + delay;
            const tone = context.createOscillator();
            const volume = context.createGain();
            tone.type = "sine";
            tone.frequency.value = frequency;
            volume.gain.setValueAtTime(0.0001, start);
            volume.gain.exponentialRampToValueAtTime(0.09, start + 0.02);
            volume.gain.exponentialRampToValueAtTime(0.0001, start + 0.22);
            tone.connect(volume).connect(context.destination);
            tone.start(start);
            tone.stop(start + 0.25);
        }
    } catch { /* no audio */ }
}
