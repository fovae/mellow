// Ready-made dictionaries. The data file is large, so it is loaded on first use.
import { normalize, stripArticle } from "./quiz.js";

let pack = null;
let loading = null;

export const LIBRARY_LANGUAGES = ["English", "Russian", "Spanish", "French", "German", "Italian"];

// Resolves to null when the file is not available (first start without a network).
export function loadLibrary() {
    loading ??= import("../data/library.js").then(({ topics }) => {
        pack = topics.map(({ data, ...topic }) => ({ ...topic, rows: parseRows(data) }));
        return pack;
    }).catch(() => { loading = null; return null; });
    return loading;
}

export const getLibrary = () => pack;

function parseRows(data) {
    const rows = [];
    for (const line of data.trim().split("\n")) {
        if (line.startsWith(">")) rows.at(-1).example = line.slice(1).split("|");
        else rows.push({ cells: line.split("|") });
    }
    return rows;
}

export const isSupported = (from, to) => from !== to && LIBRARY_LANGUAGES.includes(from) && LIBRARY_LANGUAGES.includes(to);

export const libraryKey = (topicId, from, to) => `${topicId}:${from}:${to}`;

export function topicWords(topic, from, to) {
    const [a, b] = [from, to].map((name) => LIBRARY_LANGUAGES.indexOf(name));
    return topic.rows.map(({ cells, example }) => ({
        word: cells[a], translation: cells[b], example: example ? `${example[b]} — ${example[a]}` : "",
    }));
}

export function toDictionary(topic, from, to, locale) {
    return {
        name: topic.title[locale] ?? topic.title.en, emoji: topic.emoji, description: "", from, to,
        libraryKey: libraryKey(topic.id, from, to), words: topicWords(topic, from, to),
    };
}

// "topic:from:to" -> Map of "word\ntranslation" -> example
export function libraryExamples(key) {
    const [id, from, to] = key.split(":");
    const topic = pack?.find((x) => x.id === id);
    if (!topic || !isSupported(from, to)) return null;
    return new Map(topicWords(topic, from, to).filter((w) => w.example).map((w) => [`${w.word}\n${w.translation}`, w.example]));
}

const plain = (text) => normalize(stripArticle(text.replace(/\s*\(.*?\)/g, "")));

// Pairs whose `side` starts with the query; exact matches first.
export function suggest(query, side, from, to, limit = 4) {
    const key = plain(query);
    if (!pack || key.length < 2 || !isSupported(from, to)) return [];
    const found = new Map();
    for (const topic of pack) for (const pair of topicWords(topic, from, to)) {
        const value = plain(pair[side]);
        if (value.startsWith(key)) found.set(`${pair.word}\n${pair.translation}`, { pair, length: value.length });
    }
    return [...found.values()].sort((x, y) => x.length - y.length).slice(0, limit).map((x) => x.pair);
}

// The next topic of the same language pair that is not added yet.
export const nextTopic = (from, to, addedKeys) =>
    isSupported(from, to) ? pack?.find((topic) => !addedKeys.has(libraryKey(topic.id, from, to))) ?? null : null;
