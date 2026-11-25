import { dayKey, startOfDay } from "./dates.js";
import { studyLanguages } from "../data/languages.js";
import { accents, freeAccents } from "./accents.js";
import { DIFFICULT_MISSES } from "./advice.js";
import { DROPS, FREEZE, XP, daysToFreeze, emptyDay, levelOf, newRewards, streakOf, totalXp } from "./rewards.js";
import { currentTopic, listProfiles, samePair } from "./profiles.js";
import { cleanState, toBackup } from "./transfer.js";
import { schedule, getQueue, getStatus, strength } from "./srs.js";

const uiLanguages = ["en", "ru"];
const KEY = "mellow_state";
const VERSION = 5;
const listeners = new Set();

export const createId = () =>
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const defaultSettings = () => ({ language: "en", theme: "auto", dailyGoal: 20, newPerDay: 10, reverse: false, autoSpeak: false, sound: true, haptics: true, speechRate: "normal", motion: true, backupReminder: true, accent: "mellow", native: "English", target: "Spanish" });

const defaultRewards = () => ({
    drops: 20,
    freezes: 1,
    frozen: {}, // "YYYY-MM-DD" -> true, days covered by a freeze
    owned: [...freeAccents],
    quests: { day: "", done: [] },
    rewardedLevel: 1,
});

const createState = () => ({
    version: VERSION,
    username: "",
    settings: { ...defaultSettings(), language: uiLanguages.find((code) => globalThis.navigator?.language?.startsWith(code)) ?? "en" },
    profiles: [], // { from, to }; the current one is settings.native -> settings.target
    removedTopics: [], // library keys that must not come back by themselves
    totalTimeActive: 0, // seconds
    lastBackup: null, // ms
    log: {}, // "YYYY-MM-DD" -> see emptyDay() in rewards.js
    ...defaultRewards(),
    dictionaries: [],
});

const migrations = {
    // v1 had only a "learned" flag: such words come back for review in 4 days.
    1: (old) => ({
        ...old,
        log: {},
        dictionaries: old.dictionaries.map((dict) => ({
            ...dict,
            words: dict.words.map(({ learned, ...word }) => ({
                ...word,
                srs: learned ? { due: startOfDay(Date.now(), 4), interval: 4, ease: 2.5, step: 0, lapses: 0 } : null,
            })),
        })),
    }),
    // v3: experience, quests and drops. Earlier answers count as experience.
    2: (old) => {
        const log = Object.fromEntries(Object.entries(old.log ?? {}).map(([key, day]) =>
            [key, { ...emptyDay(), ...day, xp: (day.correct ?? 0) * XP.answer }]));
        return { ...old, ...defaultRewards(), log, rewardedLevel: levelOf(totalXp(log)) };
    },
    // v4: vibration is a setting of its own.
    3: (old) => ({ ...old, settings: { ...old.settings, haptics: old.settings?.sound !== false } }),
    // v5: learning profiles instead of the active dictionary, which becomes the first topic of the current profile.
    4: ({ activeDictionaryId, ...old }) => {
        const active = old.dictionaries.find((d) => d.id === activeDictionaryId) ?? old.dictionaries[0];
        const settings = { ...old.settings, ...(active ? { native: active.from, target: active.to } : {}) };
        return {
            ...old, settings, removedTopics: [],
            dictionaries: active ? [active, ...old.dictionaries.filter((d) => d !== active)] : [],
            profiles: listProfiles(old.dictionaries, active || old.username ? [{ from: settings.native ?? "English", to: settings.target ?? "Spanish" }] : []),
        };
    },
};

// Returns null when the data is not a Mellow state of a known version.
function upgrade(saved) {
    if (!Array.isArray(saved?.dictionaries)) return null;
    for (let v = saved.version; v < VERSION; v++) {
        if (!migrations[v]) return null;
        saved = { ...migrations[v](saved), version: v + 1 };
    }
    return saved.version === VERSION ? saved : null;
}

function load() {
    let raw = null;
    try {
        raw = localStorage.getItem(KEY);
        const saved = upgrade(JSON.parse(raw));
        if (saved) return { ...saved, settings: { ...defaultSettings(), ...saved.settings } };
    } catch (error) {
        console.warn("Mellow: could not read saved data", error);
    }
    // Keep data that could not be read instead of overwriting it.
    try {
        if (raw) localStorage.setItem(`${KEY}_unreadable`, raw);
    } catch { /* no storage */ }
    return createState();
}

let state = load();

export const getState = () => state;

export function subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
}

const notify = (type) => listeners.forEach((listener) => listener(type));

const rewardListeners = new Set();
export const onRewards = (listener) => rewardListeners.add(listener);

// Quests, the daily goal and levels are checked after every answer, so nothing has to be claimed by hand.
function settleRewards() {
    const key = dayKey();
    if (state.quests.day !== key) state.quests = { day: key, done: [] };
    const { events, done } = newRewards({
        key, day: getDay(), done: state.quests.done, xp: totalXp(state.log), rewardedLevel: state.rewardedLevel, dailyGoal: state.settings.dailyGoal,
    });
    state.quests.done = done;
    for (const event of events) {
        state.drops += event.drops;
        if (event.type === "level") state.rewardedLevel = event.level;
    }
    return events;
}

// The single place where state is written.
function commit(type) {
    const events = type === "study" ? settleRewards() : [];
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
        console.warn("Mellow: could not save data", error);
    }
    notify(type);
    if (events.length) rewardListeners.forEach((listener) => listener(events));
}

// Selectors
export const getDictionary = (id) => state.dictionaries.find((d) => d.id === id);
export const getProfile = () => ({ from: state.settings.native, to: state.settings.target });
// Everything that is learned belongs to one profile; the others wait.
export const getDictionaries = (profile = getProfile()) => state.dictionaries.filter((d) => samePair(d, profile));
export const getCurrentTopic = () => currentTopic(getDictionaries());
export const getProgress = (dict) =>
    dict.words.length ? Math.round((dict.words.reduce((sum, w) => sum + strength(w.srs), 0) / dict.words.length) * 100) : 0;

export function countStatuses(words) {
    const counts = { new: 0, learning: 0, mastered: 0 };
    words.forEach((w) => { counts[getStatus(w.srs)]++; });
    return counts;
}

export const allWords = () => getDictionaries().flatMap((d) => d.words);

// Of all profiles together.
export function getTotals() {
    const words = state.dictionaries.flatMap((d) => d.words);
    return {
        words: words.length,
        favourites: words.filter((w) => w.isFavourite).length,
        seconds: state.totalTimeActive,
        ...countStatuses(words),
    };
}

export const getDay = (date) => state.log[dayKey(date)] ?? emptyDay();
export const getNewLeft = () => Math.max(0, state.settings.newPerDay - getDay().fresh);

// A scope is a dictionary id, or null for everything.
export const getScopeDictionaries = (scope) => (scope ? state.dictionaries.filter((d) => d.id === scope) : getDictionaries());

// New words come topic by topic: the order of the dictionaries is the order of the course.
export const getScopeWords = (scope) => getScopeDictionaries(scope).flatMap((d) => d.words);

export const getScopeQueue = (scope) => getQueue(getScopeWords(scope), getNewLeft());

export const findWord = (wordId) => {
    for (const dict of state.dictionaries) {
        const word = dict.words.find((w) => w.id === wordId);
        if (word) return { dict, word };
    }
    return null;
};

// Words that were often answered wrong and not yet corrected.
export const getDifficult = () => allWords().filter((w) => (w.misses ?? 0) >= DIFFICULT_MISSES).sort((a, b) => b.misses - a.misses);

// Groups words by dictionary for a test.
export const getQuizSources = (words) => {
    const ids = new Set(words.map((w) => w.id));
    return state.dictionaries.map((d) => ({ dictId: d.id, only: new Set(d.words.filter((w) => ids.has(w.id)).map((w) => w.id)) })).filter((s) => s.only.size);
};

export const getLibraryKeys = () => new Set(state.dictionaries.map((d) => d.libraryKey).filter(Boolean));
export const getAnswers = () => Object.values(state.log).reduce((sum, d) => sum + d.answers, 0);

export const getStreak = (now = Date.now()) => streakOf(state.log, state.frozen, now);

// Actions
export function setUsername(name) {
    state.username = name;
    commit("user");
}

// type "switch": the control has already moved, the screen does not need a redraw.
export function updateSettings(changes, type = "settings") {
    Object.assign(state.settings, changes);
    commit(type);
}

const today = () => (state.log[dayKey()] = { ...emptyDay(), ...state.log[dayKey()] });

function logAnswer(correct) {
    const day = today();
    day.answers++;
    if (correct) {
        day.correct++;
        day.xp += XP.answer;
    }
    return day;
}

const countMiss = (word, correct) => { word.misses = Math.max(0, (word.misses ?? 0) + (correct ? -1 : 1)); };

// Returns a function that takes the answer back.
export function gradeWord(dictId, wordId, grade) {
    const word = getDictionary(dictId)?.words.find((w) => w.id === wordId);
    if (!word) return null;
    const key = dayKey();
    const before = { srs: word.srs, misses: word.misses ?? 0, day: { ...getDay() } };
    const day = logAnswer(grade !== "again");
    if (word.srs) day.reviews++;
    else day.fresh++;
    countMiss(word, grade !== "again");
    word.srs = schedule(word.srs, grade);
    commit("study");
    return () => {
        const current = getDictionary(dictId)?.words.find((w) => w.id === wordId);
        if (!current) return;
        current.srs = before.srs;
        current.misses = before.misses;
        state.log[key] = { ...before.day, seconds: state.log[key]?.seconds ?? 0 };
        commit("study");
    };
}

// A wrong test answer makes a word that is already in study due now.
export function recordTestAnswer(dictId, wordId, correct) {
    logAnswer(correct);
    const word = getDictionary(dictId)?.words.find((w) => w.id === wordId);
    if (word) countMiss(word, correct);
    if (!correct && word?.srs) word.srs.due = Math.min(word.srs.due, Date.now());
    commit("study");
}

// Returns true when the result is a new record (not the first result).
export function saveRecord(name, value, isBetter) {
    const previous = state.records?.[name];
    if (previous !== undefined && !isBetter(value, previous)) return false;
    state.records = { ...state.records, [name]: value };
    commit("study");
    return previous !== undefined;
}

export function countGame() {
    const day = today();
    day.games++;
    day.xp += XP.game;
    commit("study");
}

// results: [{ id, mistakes }]. New words were shown and asked twice, so they come back tomorrow (or soon after mistakes).
export function finishLesson(dictId, results) {
    const day = today();
    const perfect = results.every((r) => !r.mistakes);
    const xp = XP.lesson + (perfect ? XP.perfect : 0);
    for (const { id, mistakes } of results) {
        const word = getDictionary(dictId)?.words.find((w) => w.id === id);
        if (!word) continue;
        if (!word.srs) {
            day.fresh++;
            word.srs = schedule(null, "good");
            if (!mistakes) word.srs = schedule(word.srs, "good");
        } else if (word.srs.due <= Date.now()) {
            day.reviews++;
            word.srs = schedule(word.srs, mistakes ? "again" : "good");
        }
    }
    day.lessons++;
    if (perfect) day.perfect++;
    day.xp += xp;
    state.drops += DROPS.lesson;
    commit("study");
    return { xp, drops: DROPS.lesson };
}

export function buyFreeze() {
    if (state.drops < FREEZE.price || state.freezes >= FREEZE.max) return;
    state.drops -= FREEZE.price;
    state.freezes++;
    commit("settings");
}

export function buyAccent(id) {
    const accent = accents.find((a) => a.id === id);
    if (!accent || state.owned.includes(id) || state.drops < accent.price) return;
    state.drops -= accent.price;
    state.owned.push(id);
    state.settings.accent = id;
    commit("settings");
}

// Missed days are covered by freezes when there are enough of them.
export function protectStreak() {
    const days = daysToFreeze(state.log, state.frozen, state.freezes);
    if (!days.length) return;
    state.freezes -= days.length;
    for (const day of days) state.frozen[day] = true;
    commit("settings");
    rewardListeners.forEach((listener) => listener([{ type: "freeze", drops: 0 }]));
}

// Moves a topic to the beginning of the course.
export function learnFirst(id) {
    const dict = getDictionary(id);
    if (!dict) return;
    state.dictionaries = [dict, ...state.dictionaries.filter((d) => d !== dict)];
    commit("dictionaries");
}

export function switchProfile({ from, to }) {
    state.profiles = listProfiles(state.profiles, [{ from, to }]);
    Object.assign(state.settings, { native: from, target: to });
    commit("profile");
}

// The last profile stays.
export function removeProfile(profile) {
    if (state.profiles.length < 2) return;
    state.profiles = state.profiles.filter((p) => !samePair(p, profile));
    state.dictionaries = state.dictionaries.filter((d) => !samePair(d, profile));
    if (samePair(getProfile(), profile)) Object.assign(state.settings, { native: state.profiles[0].from, target: state.profiles[0].to });
    commit("profile");
}

const createWord = ({ word, translation, example = "" }) => ({
    id: createId(), word, translation, example, misses: 0, isFavourite: false, srs: null,
});

export function addDictionary({ words = [], ...data }) {
    const dict = { id: createId(), ...data, words: words.map(createWord) };
    state.dictionaries.push(dict);
    commit("dictionaries");
    return dict;
}

export function addDictionaries(list) {
    const added = list.map(({ words = [], ...data }) => ({ id: createId(), ...data, words: words.map(createWord) }));
    if (!added.length) return added;
    state.dictionaries.push(...added);
    commit("dictionaries");
    return added;
}

// Adds examples that appeared in the library later. Never replaces the user's own text.
export function fillExamples(examplesOf) {
    let changed = false;
    for (const dict of state.dictionaries) {
        const examples = dict.libraryKey && examplesOf(dict.libraryKey);
        if (!examples) continue;
        for (const word of dict.words) {
            const example = examples.get(`${word.word}\n${word.translation}`);
            if (word.example || !example) continue;
            word.example = example;
            changed = true;
        }
    }
    if (changed) commit("dictionaries");
}

export function updateDictionary(id, changes) {
    const dict = getDictionary(id);
    if (!dict) return;
    Object.assign(dict, changes);
    commit("dictionaries");
}

export function removeDictionary(id) {
    const key = getDictionary(id)?.libraryKey;
    if (key) state.removedTopics = [...new Set([...state.removedTopics, key])];
    state.dictionaries = state.dictionaries.filter((d) => d.id !== id);
    commit("dictionaries");
}

export function addWord(dictId, data) {
    const dict = getDictionary(dictId);
    if (!dict) return;
    dict.words.push(createWord(data));
    commit("dictionaries");
}

export function addWords(dictId, list) {
    const dict = getDictionary(dictId);
    if (!dict || !list.length) return;
    dict.words.push(...list.map(createWord));
    commit("dictionaries");
}

export function updateWord(dictId, wordId, changes) {
    const word = getDictionary(dictId)?.words.find((w) => w.id === wordId);
    if (!word) return;
    Object.assign(word, changes);
    commit("dictionaries");
}

export function removeWord(dictId, wordId) {
    const dict = getDictionary(dictId);
    if (!dict) return;
    dict.words = dict.words.filter((w) => w.id !== wordId);
    commit("dictionaries");
}

export function addActiveTime(seconds) {
    state.totalTimeActive += seconds;
    today().seconds += seconds;
    commit("time");
}

// Backup
export const getBackup = () => toBackup(state);

export function markBackup() {
    state.lastBackup = Date.now();
    commit("settings");
}

// Returns a checked state, or null when the file is not a Mellow backup.
export function readBackup(text) {
    try {
        const { app, state: saved } = JSON.parse(text);
        const upgraded = app === "mellow" ? upgrade(saved) : null;
        return upgraded && cleanState(upgraded, createState(), createId, { languages: uiLanguages, studyLanguages });
    } catch {
        return null;
    }
}

export function restore(next) {
    state = next;
    commit("restore");
}

// Removes only Mellow's key: other apps may share the same origin.
export function resetAll() {
    localStorage.removeItem(KEY);
    localStorage.removeItem(`${KEY}_unreadable`);
    state = createState();
    notify("reset");
}

// Keep several open tabs in sync.
window.addEventListener("storage", (event) => {
    if (event.key === KEY) {
        state = load();
        notify("sync");
    }
});
