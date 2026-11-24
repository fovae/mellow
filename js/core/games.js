// Game logic. Pure functions.
import { normalize, shuffle } from "./quiz.js";

// Words whose both sides are different, so every pair has one answer.
export function pickPairs(words, count) {
    const seen = [new Set(), new Set()];
    const result = [];
    for (const word of shuffle(words)) {
        const keys = [normalize(word.word), normalize(word.translation)];
        if (result.length >= count || keys.some((key, i) => !key || seen[i].has(key))) continue;
        keys.forEach((key, i) => seen[i].add(key));
        result.push(word);
    }
    return result;
}

// A lone punctuation mark (French " ?") stays with the previous word.
export const tokens = (text) => text.trim().split(/\s+/).reduce((list, part) => {
    if (list.length && !/[\p{L}\p{N}]/u.test(part)) list[list.length - 1] += ` ${part}`;
    else list.push(part);
    return list;
}, []);

// Sentences of 3–9 words: phrases themselves and examples ("target — native").
export function buildSentences(words, count) {
    const all = words.flatMap((w) => {
        const [target, native] = (w.example ?? "").split(" — ");
        return [
            { wordId: w.id, prompt: w.word, answer: w.translation },
            ...(target && native ? [{ wordId: w.id, prompt: native, answer: target }] : []),
        ];
    }).map((s) => ({ ...s, parts: tokens(s.answer) })).filter((s) => s.parts.length >= 3 && s.parts.length <= 9);
    return shuffle(all).slice(0, count).map((s) => ({ ...s, shuffled: mix(s.parts) }));
}

// Shuffled, but never in the right order when that is possible.
function mix(parts) {
    for (let i = 0; i < 20; i++) {
        const next = shuffle(parts);
        if (next.join(" ") !== parts.join(" ")) return next;
    }
    return [...parts].reverse();
}

export const isSentence = (sentence, parts) => normalize(parts.join(" ")) === normalize(sentence.answer);

// One statement for the sprint: half of them are true.
export function buildStatement(words, lastId, random = Math.random) {
    const pool = words.filter((w) => w.id !== lastId);
    const word = pool[Math.floor(random() * pool.length)] ?? words[0];
    if (random() < 0.5) return { word, shown: word.translation, truth: true };
    const same = new Set(words.filter((w) => normalize(w.word) === normalize(word.word)).map((w) => normalize(w.translation)));
    const other = shuffle(words).find((w) => !same.has(normalize(w.translation)));
    return other ? { word, shown: other.translation, truth: false } : { word, shown: word.translation, truth: true };
}
