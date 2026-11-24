// Turns any dictionary into a path of short lessons. Pure.
import { buildQuiz } from "./quiz.js";
import { buildSentences, pickPairs } from "./games.js";
import { getStatus, strength } from "./srs.js";

export const LESSON_SIZE = 6;
const MIN_TAIL = 3;
const TEST_EVERY = 4;

export function splitLessons(words) {
    const lessons = [];
    for (let i = 0; i < words.length; i += LESSON_SIZE) lessons.push(words.slice(i, i + LESSON_SIZE));
    // A very short tail joins the previous lesson.
    if (lessons.length > 1 && lessons.at(-1).length < MIN_TAIL) lessons.splice(-2, 2, [...lessons.at(-2), ...lessons.at(-1)]);
    return lessons;
}

// Progress is taken from the words, so studying anywhere moves the path.
export function buildPath(words) {
    const nodes = [];
    const lessons = splitLessons(words);
    let current = false;
    let open = []; // lessons since the last checkpoint
    lessons.forEach((list, i) => {
        const done = list.every((w) => w.srs);
        const node = {
            type: "lesson", number: i + 1, words: list, done,
            mastered: list.every((w) => getStatus(w.srs) === "mastered"),
            progress: list.reduce((sum, w) => sum + strength(w.srs), 0) / list.length,
            current: !done && !current,
        };
        if (node.current) current = true;
        nodes.push(node);
        open.push(node);
        if (open.length === TEST_EVERY || (i === lessons.length - 1 && open.length > 1)) {
            nodes.push({ type: "test", words: open.flatMap((n) => n.words), done: open.every((n) => n.done) });
            open = [];
        }
    });
    return nodes;
}

const question = (word, words, reverse) => buildQuiz(words, { count: 1, reverse, only: new Set([word.id]) })[0];

// New words are shown first, then asked twice in different ways.
export function buildLesson(list, words, { speech, random = Math.random }) {
    const steps = [];
    const ask = (word, mode, reverse) => {
        const q = question(word, words, reverse);
        return { type: "question", mode: q.options.length < 2 && mode !== "typing" ? "typing" : mode, reverse, wordId: word.id, question: q };
    };
    for (let i = 0; i < list.length; i += 3) {
        const group = list.slice(i, i + 3);
        group.filter((w) => !w.srs).forEach((word) => steps.push({ type: "intro", wordId: word.id }));
        group.forEach((word) => steps.push(ask(word, "choice", false)));
    }
    const pairs = pickPairs(list, 5);
    if (pairs.length >= 3) steps.push({ type: "pairs", words: pairs });
    const modes = ["typing", ...(speech ? ["listen"] : []), "reverse"];
    list.forEach((word, i) => {
        const [sentence] = buildSentences([word], 1);
        if (sentence && random() < 0.5) return steps.push({ type: "sentence", wordId: word.id, sentence });
        // A long phrase is hard to type on a phone.
        let mode = modes[i % modes.length];
        if (mode === "typing" && word.translation.length > 18) mode = "reverse";
        steps.push(mode === "typing" ? ask(word, "typing", false) : ask(word, mode === "reverse" ? "choice" : mode, true));
    });
    return steps;
}
