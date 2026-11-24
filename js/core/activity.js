import { addActiveTime } from "./store.js";

const STEP = 30; // seconds
let timer = null;

// Counts time only while the app is visible; never runs two timers at once.
export function startActivityTracker() {
    const sync = () => {
        clearInterval(timer);
        timer = document.hidden ? null : setInterval(() => addActiveTime(STEP), STEP * 1000);
    };
    document.addEventListener("visibilitychange", sync);
    sync();
}
