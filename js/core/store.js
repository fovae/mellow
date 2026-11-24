import { createStarterDictionaries } from "../data/starter.js";

const KEY = "mellow_state";
const VERSION = 1;
const listeners = new Set();

export const createId = () =>
    globalThis.crypto?.randomUUID?.() ?? `${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

const createState = () => ({
    version: VERSION,
    username: "",
    settings: { language: "en" },
    activeDictionaryId: null,
    totalTimeActive: 0, // seconds
    dictionaries: createStarterDictionaries(createId),
});

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY));
        if (saved?.version === VERSION && Array.isArray(saved.dictionaries)) return saved;
    } catch (error) {
        console.warn("Mellow: could not read saved data", error);
    }
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
export const countLearned = (dict) => dict.words.filter((w) => w.learned).length;
export const getProgress = (dict) =>
    dict.words.length ? Math.round((countLearned(dict) / dict.words.length) * 100) : 0;

export function getTotals() {
    const words = state.dictionaries.flatMap((d) => d.words);
    return {
        dictionaries: state.dictionaries.length,
        words: words.length,
        favourites: words.filter((w) => w.isFavourite).length,
        learned: words.filter((w) => w.learned).length,
        seconds: state.totalTimeActive,
    };
}

// Actions
export function setUsername(name) {
    state.username = name;
    commit("user");
}

export function setLanguage(language) {
    state.settings.language = language;
    commit("language");
}

export function setActiveDictionary(id) {
    state.activeDictionaryId = id;
    commit("dictionaries");
}

const createWord = ({ word, translation }) => ({
    id: createId(), word, translation, isFavourite: false, learned: false,
});

export function addDictionary({ words = [], ...data }) {
    const dict = { id: createId(), ...data, words: words.map(createWord) };
    state.dictionaries.push(dict);
    commit("dictionaries");
    return dict;
}

export function updateDictionary(id, changes) {
    const dict = getDictionary(id);
    if (!dict) return;
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
    commit("time");
}

// Removes only Mellow's key: other apps may share the same origin.
export function resetAll() {
    localStorage.removeItem(KEY);
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
