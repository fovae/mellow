// Spaced repetition (SM-2 style). Pure functions: no DOM, no storage.
// card: { due: ms, interval: days (0 = still learning), ease, step, lapses }
import { startOfDay } from "./dates.js";

export const GRADES = ["again", "hard", "good", "easy"];
export const MASTERED_DAYS = 21;
export const LEARN_AHEAD = 20 * 60000;

const MINUTE = 60000;
const MAX_DAYS = 365;
const MIN_EASE = 1.3;
const clampDays = (days) => Math.min(MAX_DAYS, Math.max(1, Math.round(days)));

export function schedule(card, grade, now = Date.now()) {
    const { interval, ease, step, lapses } = card ?? { interval: 0, ease: 2.5, step: 0, lapses: 0 };
    const inMinutes = (minutes, nextStep, extra = {}) =>
        ({ due: now + minutes * MINUTE, interval: 0, ease, step: nextStep, lapses, ...extra });
    const inDays = (days, nextEase = ease) =>
        ({ due: startOfDay(now, days), interval: days, ease: nextEase, step: 0, lapses });

    if (interval < 1) {
        if (grade === "again") return inMinutes(1, 0);
        if (grade === "hard") return inMinutes(5, step);
        if (grade === "easy") return inDays(4);
        return step < 1 ? inMinutes(10, 1) : inDays(1);
    }

    // A lapsed word is learned again from the last step.
    if (grade === "again") {
        return inMinutes(10, 1, { ease: Math.max(MIN_EASE, ease - 0.2), lapses: lapses + 1 });
    }
    const hard = clampDays(Math.max(interval * 1.2, interval + 1));
    const good = clampDays(Math.max(interval * ease, hard + 1));
    const easy = clampDays(Math.max(interval * ease * 1.3, good + 1));
    if (grade === "hard") return inDays(hard, Math.max(MIN_EASE, ease - 0.15));
    if (grade === "good") return inDays(good);
    return inDays(easy, ease + 0.15);
}

export function getStatus(card) {
    if (!card) return "new";
    return card.interval >= MASTERED_DAYS ? "mastered" : "learning";
}

// 0..1, used for progress.
export const strength = (card) => (card ? Math.min(1, Math.max(0.1, card.interval / MASTERED_DAYS)) : 0);

// What is waiting now. Short learning steps count even if a few minutes remain.
export function getQueue(words, newLeft, now = Date.now()) {
    const started = words.filter((w) => w.srs).sort((a, b) => a.srs.due - b.srs.due);
    return {
        due: started.filter((w) => w.srs.due <= now),
        soon: started.filter((w) => w.srs.due > now && w.srs.interval < 1 && w.srs.due <= now + LEARN_AHEAD),
        fresh: words.filter((w) => !w.srs).slice(0, Math.max(0, newLeft)),
    };
}

// Order: due words, new words, then learning words that are almost due.
export function pickNext(words, newLeft, lastId = null, now = Date.now()) {
    const { due, soon, fresh } = getQueue(words, newLeft, now);
    const list = [...due, ...fresh, ...soon];
    return list.find((w) => w.id !== lastId) ?? list[0] ?? null;
}
