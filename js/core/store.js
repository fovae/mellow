import { dayKey, startOfDay } from "./dates.js";
import { studyLanguages } from "../data/languages.js";
import { DIFFICULT_MISSES } from "./advice.js";
import { LIBRARY_LANGUAGES } from "./library.js";
import { cleanState, toBackup } from "./transfer.js";
import { schedule, getQueue, getStatus, strength } from "./srs.js";

const uiLanguages = ["en", "ru"];
const KEY = "mellow_state";
const VERSION = 2;
const listeners = new Set();

export const createId = () =>
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const defaultSettings = () => ({ language: "en", theme: "auto", dailyGoal: 20, newPerDay: 10, reverse: false, autoSpeak: false, native: "English", target: "Spanish" });

const createState = () => ({
    version: VERSION,
    username: "",
    settings: defaultSettings(),
    activeDictionaryId: null,
    totalTimeActive: 0, // seconds
    lastBackup: null, // ms
    log: {}, // "YYYY-MM-DD" -> { answers, correct, fresh, seconds }
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

// The single place where state is written.
function commit(type) {
    try {
        localStorage.setItem(KEY, JSON.stringify(state));
    } catch (error) {
        console.warn("Mellow: could not save data", error);
    }
    notify(type);
}

// Selectors
export const getDictionary = (id) => state.dictionaries.find((d) => d.id === id);
export const getActiveDictionary = () => getDictionary(state.activeDictionaryId);
export const getProgress = (dict) =>
    dict.words.length ? Math.round((dict.words.reduce((sum, w) => sum + strength(w.srs), 0) / dict.words.length) * 100) : 0;

export function countStatuses(words) {
    const counts = { new: 0, learning: 0, mastered: 0 };
    words.forEach((w) => { counts[getStatus(w.srs)]++; });
    return counts;
}

export const allWords = () => state.dictionaries.flatMap((d) => d.words);

export function getTotals() {
    const words = allWords();
    return {
        dictionaries: state.dictionaries.length,
        words: words.length,
        favourites: words.filter((w) => w.isFavourite).length,
        seconds: state.totalTimeActive,
        ...countStatuses(words),
    };
}

const emptyDay = () => ({ answers: 0, correct: 0, fresh: 0, seconds: 0 });
export const getDay = (date) => state.log[dayKey(date)] ?? emptyDay();
export const getNewLeft = () => Math.max(0, state.settings.newPerDay - getDay().fresh);

// A scope is a dictionary id, or null for everything.
export const getScopeDictionaries = (scope) => (scope ? state.dictionaries.filter((d) => d.id === scope) : state.dictionaries);

// In the mixed scope new words come only from the active dictionary, so topics are not started all at once.
export const getScopeWords = (scope) => getScopeDictionaries(scope)
    .flatMap((d) => (scope || d.id === state.activeDictionaryId ? d.words : d.words.filter((w) => w.srs)));

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
export const getDictQueue = (dict) => getQueue(dict.words, getNewLeft());

// Days in a row with at least one answer. Today may still be empty.
export function getStreak(now = Date.now()) {
    let streak = 0;
    for (let i = getDay(now).answers ? 0 : -1; getDay(startOfDay(now, i)).answers; i--) streak++;
    return streak;
}

// Actions
export function setUsername(name) {
    state.username = name;
    commit("user");
}

export function updateSettings(changes) {
    Object.assign(state.settings, changes);
    commit("settings");
}

const today = () => (state.log[dayKey()] ??= emptyDay());

function logAnswer(correct) {
    const day = today();
    day.answers++;
    if (correct) day.correct++;
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
    if (!word.srs) day.fresh++;
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

export function setActiveDictionary(id) {
    state.activeDictionaryId = id;
    commit("dictionaries");
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
    if (!getActiveDictionary()) state.activeDictionaryId = added[0].id;
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
    // Another language pair: no longer a copy of the library topic.
    if ((changes.from ?? dict.from) !== dict.from || (changes.to ?? dict.to) !== dict.to) delete dict.libraryKey;
    Object.assign(dict, changes);
    commit("dictionaries");
}

export function removeDictionary(id) {
    state.dictionaries = state.dictionaries.filter((d) => d.id !== id);
    if (state.activeDictionaryId === id) state.activeDictionaryId = null;
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
        return upgraded && cleanState(upgraded, createState(), createId, { languages: uiLanguages, studyLanguages, libraryLanguages: LIBRARY_LANGUAGES });
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
