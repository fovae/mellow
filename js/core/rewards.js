// Experience, levels, daily quests, streak protection. Pure: no DOM, no storage.
import { dayKey, startOfDay } from "./dates.js";

export const XP = { answer: 2, game: 10, lesson: 10, perfect: 10 };
export const DROPS = { quest: 10, chest: 20, level: 20, lesson: 5 };
export const FREEZE = { price: 40, max: 3 };

export const emptyDay = () => ({ answers: 0, correct: 0, fresh: 0, seconds: 0, xp: 0, lessons: 0, games: 0, perfect: 0, reviews: 0 });

// Level n starts at 25 · n · (n − 1): 0, 50, 150, 300, 500…
export const levelStart = (level) => 25 * level * (level - 1);
export const levelOf = (xp) => Math.floor((1 + Math.sqrt(1 + (4 * Math.max(0, xp)) / 25)) / 2);
export function levelInfo(xp) {
    const level = levelOf(xp);
    const start = levelStart(level);
    return { level, done: xp - start, need: levelStart(level + 1) - start };
}
export const totalXp = (log) => Object.values(log).reduce((sum, day) => sum + (day.xp ?? 0), 0);

// field -> goals it may get
const pool = [
    { field: "xp", goals: [30, 50, 80] },
    { field: "lessons", goals: [1, 2] },
    { field: "correct", goals: [15, 25, 40] },
    { field: "reviews", goals: [5, 10] },
    { field: "games", goals: [1, 2] },
    { field: "perfect", goals: [1] },
    { field: "fresh", goals: [5, 10] },
];

const hash = (text) => [...text].reduce((sum, c) => Math.imul(sum ^ c.charCodeAt(0), 16777619) >>> 0, 2166136261);

// Three quests a day, the same all day. Quests that cannot be done now are left out when the day starts empty.
export function dailyQuests(key) {
    const list = pool.map((quest) => ({ quest, order: hash(`${key}:${quest.field}`) })).sort((a, b) => a.order - b.order).slice(0, 3);
    return list.map(({ quest, order }) => ({ id: quest.field, field: quest.field, goal: quest.goals[order % quest.goals.length] }));
}

// What became due for a reward. `done` are the ids already rewarded today.
export function newRewards({ key, day, done, xp, rewardedLevel, dailyGoal }) {
    const events = [];
    const quests = dailyQuests(key);
    const finished = new Set(done);
    for (const quest of quests) {
        if (finished.has(quest.id) || day[quest.field] < quest.goal) continue;
        finished.add(quest.id);
        events.push({ type: "quest", id: quest.id, drops: DROPS.quest });
    }
    if (!finished.has("chest") && quests.every((quest) => finished.has(quest.id))) {
        finished.add("chest");
        events.push({ type: "chest", drops: DROPS.chest });
    }
    if (!finished.has("goal") && day.answers >= dailyGoal) {
        finished.add("goal");
        events.push({ type: "goal", drops: 0 });
    }
    for (let level = rewardedLevel + 1; level <= levelOf(xp); level++) events.push({ type: "level", level, drops: DROPS.level });
    return { events, done: [...finished] };
}

const isActive = (log, time) => (log[dayKey(time)]?.answers ?? 0) > 0;

// Frozen days keep the streak but do not make it longer. Today may still be empty.
export function streakOf(log, frozen, now = Date.now()) {
    let streak = 0;
    for (let i = isActive(log, now) ? 0 : -1; ; i--) {
        const time = startOfDay(now, i);
        if (isActive(log, time)) streak++;
        else if (!frozen[dayKey(time)]) return streak;
    }
}

// Days between the last active day and today that can be covered by the freezes.
export function daysToFreeze(log, frozen, freezes, now = Date.now()) {
    const missed = [];
    for (let i = -1; missed.length <= freezes; i--) {
        const time = startOfDay(now, i);
        if (isActive(log, time)) return missed;
        if (!frozen[dayKey(time)]) missed.push(dayKey(time));
        if (i < -400) break;
    }
    return [];
}
