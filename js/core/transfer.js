// Import and export formats. Pure functions: no DOM, no storage.
import { normalize } from "./quiz.js";

export const MAX_TEXT = 120;
export const MAX_WORDS = 5000;

// Two words are the same when both sides match.
export const wordKey = ({ word, translation }) => `${normalize(word)}\n${normalize(translation)}`;

const DELIMITERS = ["\t", ";", /\s[-–—=]\s/, ","];

// Splits a line into two sides. Quotes protect delimiters inside a field.
function splitLine(line, delimiter) {
    if (delimiter instanceof RegExp) {
        const match = delimiter.exec(line);
        return match ? [line.slice(0, match.index), line.slice(match.index + match[0].length)] : [line];
    }
    const fields = [""];
    let quoted = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const last = fields.length - 1;
        if (quoted && char === '"' && line[i + 1] === '"') { fields[last] += '"'; i++; }
        else if (quoted && char === '"') quoted = false;
        else if (!quoted && char === '"' && !fields[last].trim()) { quoted = true; fields[last] = ""; }
        else if (!quoted && char === delimiter) fields.push("");
        else fields[last] += char;
    }
    return fields;
}

// Reads "word<delimiter>translation" lines. The delimiter that fits most lines wins.
// Returns the new words and how many lines were duplicates or could not be read.
export function parseWords(text, existing = []) {
    const lines = text.replace(/^﻿/, "").split(/\r\n|\r|\n/).filter((line) => line.trim());
    const tries = DELIMITERS.map((delimiter) => lines.map((line) => splitLine(line, delimiter).map((f) => f.trim())));
    const isPair = ([word, translation]) => Boolean(word && translation && word.length <= MAX_TEXT && translation.length <= MAX_TEXT);
    const score = (rows) => rows.filter(isPair).length;
    const rows = tries.reduce((best, next) => (score(next) > score(best) ? next : best));

    const seen = new Set(existing.map(wordKey));
    const result = { words: [], duplicates: 0, invalid: 0 };
    for (const row of rows) {
        if (!isPair(row) || result.words.length >= MAX_WORDS) { result.invalid++; continue; }
        const word = { word: row[0], translation: row[1] };
        const key = wordKey(word);
        if (seen.has(key)) { result.duplicates++; continue; }
        seen.add(key);
        result.words.push(word);
    }
    return result;
}

// The BOM makes Excel read the file as UTF-8.
export function toCSV(words) {
    const cell = (text) => {
        const line = text.replace(/\s+/g, " ");
        return /[",;]/.test(line) ? `"${line.replaceAll('"', '""')}"` : line;
    };
    return "﻿" + words.map((w) => `${cell(w.word)},${cell(w.translation)}`).join("\r\n") + "\r\n";
}

export const toBackup = (state) => JSON.stringify({ app: "mellow", savedAt: Date.now(), state });

const isObject = (value) => typeof value === "object" && value !== null && !Array.isArray(value);
const text = (value, max, fallback = "") => (typeof value === "string" ? value.slice(0, max) : fallback);
const number = (value, min, max, fallback) => (Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback);
const oneOf = (value, options, fallback) => (options.includes(value) ? value : fallback);

const MAX_DATE = 8.64e15;
const cleanSrs = (srs) => (isObject(srs) && Number.isFinite(srs.due) ? {
    due: number(srs.due, 0, MAX_DATE, 0),
    interval: number(srs.interval, 0, 365, 0),
    ease: number(srs.ease, 1.3, 10, 2.5),
    step: number(srs.step, 0, 1, 0),
    lapses: number(srs.lapses, 0, 1e6, 0),
} : null);

// Rebuilds a state field by field, so a damaged or edited file cannot break the app.
export function cleanState(raw, defaults, createId, { languages, studyLanguages }) {
    const ids = new Set();
    const id = (value) => {
        const result = typeof value === "string" && value && !ids.has(value) ? value : createId();
        ids.add(result);
        return result;
    };
    const dictionaries = raw.dictionaries.filter((d) => isObject(d) && Array.isArray(d.words)).map((d) => ({
        id: id(d.id),
        name: text(d.name, 80) || "Dictionary",
        description: text(d.description, 140),
        emoji: text(d.emoji, 16) || "📚",
        from: oneOf(d.from, studyLanguages, "English"),
        to: oneOf(d.to, studyLanguages, "Spanish"),
        words: d.words.filter((w) => isObject(w) && text(w.word, MAX_TEXT).trim() && text(w.translation, MAX_TEXT).trim()).map((w) => ({
            id: id(w.id),
            word: text(w.word, MAX_TEXT),
            translation: text(w.translation, MAX_TEXT),
            isFavourite: w.isFavourite === true,
            srs: cleanSrs(w.srs),
        })),
    }));
    const settings = isObject(raw.settings) ? raw.settings : {};
    const days = Object.entries(isObject(raw.log) ? raw.log : {}).filter(([key, day]) => /^\d{4}-\d\d-\d\d$/.test(key) && isObject(day));
    return {
        version: defaults.version,
        username: text(raw.username, 30),
        settings: {
            language: oneOf(settings.language, languages, defaults.settings.language),
            theme: oneOf(settings.theme, ["auto", "light", "dark"], defaults.settings.theme),
            dailyGoal: number(settings.dailyGoal, 1, 1000, defaults.settings.dailyGoal),
            newPerDay: number(settings.newPerDay, 0, 1000, defaults.settings.newPerDay),
            reverse: settings.reverse === true,
        },
        activeDictionaryId: dictionaries.some((d) => d.id === raw.activeDictionaryId) ? raw.activeDictionaryId : null,
        totalTimeActive: number(raw.totalTimeActive, 0, 1e10, 0),
        lastBackup: null,
        log: Object.fromEntries(days.map(([key, day]) => [key, Object.fromEntries(
            ["answers", "correct", "fresh", "seconds"].map((name) => [name, number(day[name], 0, 1e6, 0)]))])),
        dictionaries,
    };
}
