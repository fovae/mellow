import test from "node:test";
import assert from "node:assert/strict";
import { schedule, pickNext, getStatus, getQueue } from "../js/core/srs.js";
import { startOfDay } from "../js/core/dates.js";
import { parseWords, toCSV, cleanState } from "../js/core/transfer.js";
import { loadLibrary, suggest, nextTopic, libraryKey, topicWords, LIBRARY_LANGUAGES } from "../js/core/library.js";
import { libraryLanguages } from "../js/data/library.js";
import { getAchievements, bestStreak } from "../js/core/achievements.js";
import { getAdvice } from "../js/core/advice.js";
import { pickPairs, tokens, buildSentences, isSentence, buildStatement } from "../js/core/games.js";
import en from "../js/i18n/en.js";
import ru from "../js/i18n/ru.js";
import { buildQuiz, hintMask, isCorrect, normalize } from "../js/core/quiz.js";

const now = new Date(2026, 10, 24, 15).getTime();

test("a new word needs two good answers, then comes back tomorrow", () => {
    const first = schedule(null, "good", now);
    assert.equal(first.due, now + 600000);
    const second = schedule(first, "good", now);
    assert.equal(second.interval, 1);
    assert.equal(second.due, startOfDay(now, 1));
});
test("hard < good < easy at every interval, up to the cap", () => {
    for (let interval = 1; interval < 300; interval++) {
        const [h, g, e] = ["hard", "good", "easy"].map((x) => schedule({ interval, ease: 1.3, step: 0, lapses: 0 }, x, now).interval);
        assert.ok(interval < h && h <= g && g <= e && e <= 365, `${interval}: ${h} ${g} ${e}`);
    }
});
test("again lapses a word and ease has a floor", () => {
    const card = schedule({ interval: 30, ease: 1.35, step: 0, lapses: 0 }, "again", now);
    assert.deepEqual([card.interval, card.lapses, card.ease], [0, 1, 1.3]);
});
test("statuses", () => {
    assert.equal(getStatus(null), "new");
    assert.equal(getStatus({ interval: 20 }), "learning");
    assert.equal(getStatus({ interval: 21 }), "mastered");
});
test("queue: due, then new within the limit, then soon; no immediate repeat", () => {
    const words = [
        { id: "new1", srs: null }, { id: "new2", srs: null },
        { id: "soon", srs: { due: now + 60000, interval: 0 } },
        { id: "due", srs: { due: now - 1, interval: 3 } },
        { id: "later", srs: { due: now + 9e8, interval: 9 } },
    ];
    assert.equal(pickNext(words, 1, null, now).id, "due");
    assert.equal(pickNext(words, 1, "due", now).id, "new1");
    assert.equal(getQueue(words, 1, now).fresh.length, 1);
    assert.equal(pickNext(words.slice(2, 3), 0, "soon", now).id, "soon");
    assert.equal(pickNext(words.slice(4), 0, null, now), null);
});
test("quiz: one right option, no duplicates, synonyms accepted", () => {
    const words = [["big", "grande"], ["large", "grande"], ["cat", "gato"], ["cat", "minino"], ["sun", "sol"], ["sea", "mar"]]
        .map(([word, translation], id) => ({ id, word, translation }));
    for (let i = 0; i < 100; i++) for (const reverse of [false, true]) for (const q of buildQuiz(words, { count: 6, reverse })) {
        assert.equal(new Set(q.options.map(normalize)).size, q.options.length);
        assert.equal(q.options.filter((o) => isCorrect(q, o)).length, 1);
    }
    const q = buildQuiz(words, { count: 6, reverse: false }).find((x) => x.prompt === "cat");
    assert.ok(isCorrect(q, "Gato!") && isCorrect(q, "minino") && !isCorrect(q, "") && !isCorrect(q, "sol"));
});
test("accents are optional, й is not и", () => {
    assert.equal(normalize("Adiós"), "adios");
    assert.notEqual(normalize("мой"), normalize("мои"));
    assert.notEqual(normalize("が"), normalize("か"));
});
test("import: delimiters, quotes, duplicates, bad lines", () => {
    const pairs = (text) => parseWords(text).words.map((w) => [w.word, w.translation]);
    const expected = [["cat", "gato"], ["well-known", "conocido"]];
    for (const d of ["\t", ";", ",", " - ", " — "]) assert.deepEqual(pairs(`cat${d}gato\r\nwell-known${d}conocido\n\n`), expected, d);
    assert.deepEqual(pairs("big - grande, gran"), [["big", "grande, gran"]]);
    const result = parseWords("cat;gato\nCat;Gato\nsun;sol\nbroken\n;x", [{ word: "sun", translation: "sol" }]);
    assert.deepEqual([result.words.length, result.duplicates, result.invalid], [1, 2, 2]);
    assert.equal(parseWords("").words.length, 0);
});
test("export and import return the same words", () => {
    const words = [["a, b", "c; d"], ['say "hi"', "привет"], ["x - y", "z"], ["cat", "gato"]].map(([word, translation]) => ({ word, translation }));
    assert.deepEqual(parseWords(toCSV(words)).words, words);
});
test("a damaged backup is cleaned", () => {
    const defaults = { version: 2, settings: { language: "en", theme: "auto", dailyGoal: 20, newPerDay: 10, reverse: false, autoSpeak: false, native: "English", target: "Spanish" } };
    let n = 0;
    const clean = cleanState({
        username: 5, settings: { theme: "x", dailyGoal: "a" }, activeDictionaryId: "gone", log: { bad: {}, "2026-11-24": { answers: "x", correct: 2 } },
        dictionaries: [null, { id: "d", name: {}, from: "Elvish", words: [null, { id: "w", word: "a", translation: "b", srs: { due: 1, interval: "x" } }, { id: "w", word: "c", translation: "d", srs: 5 }, { word: "", translation: "x" }] }],
    }, defaults, () => `new${n++}`, { languages: ["en"], studyLanguages: ["English", "Spanish"], libraryLanguages: ["English", "Spanish"] });
    assert.deepEqual(clean.settings, defaults.settings);
    assert.deepEqual(clean.log, { "2026-11-24": { answers: 0, correct: 2, fresh: 0, seconds: 0 } });
    const [dict] = clean.dictionaries;
    assert.deepEqual([clean.username, clean.activeDictionaryId, dict.name, dict.from, dict.words.length], ["", null, "Dictionary", "English", 2]);
    assert.notEqual(dict.words[0].id, dict.words[1].id);
    assert.deepEqual([dict.words[0].srs.interval, dict.words[1].srs], [0, null]);
});
test("articles and notes are optional, a wrong article is a mistake", () => {
    const q = (answer) => ({ accepted: [answer] });
    assert.ok(isCorrect(q("der Hund"), "hund") && isCorrect(q("der Hund"), "Der Hund") && !isCorrect(q("der Hund"), "die Hund"));
    assert.ok(isCorrect(q("l'amico"), "amico") && isCorrect(q("to go"), "go") && isCorrect(q("you (informal)"), "you"));
    assert.ok(!isCorrect(q("la"), "") && isCorrect(q("la"), "la"));
});
test("hints open letters and keep the article", () => {
    assert.equal(hintMask("el perro", 1), "el p••••");
    assert.equal(hintMask("по дороге", 2), "по ••••••");
    assert.equal(hintMask("l'eau", 1), "l'e••");
});
test("library: six filled columns, unique words, suggestions, next topic", async () => {
    const topics = await loadLibrary();
    assert.deepEqual(libraryLanguages, LIBRARY_LANGUAGES);
    assert.equal(new Set(topics.map((x) => x.id)).size, topics.length);
    for (const topic of topics) {
        assert.ok(topic.title.en && topic.title.ru);
        for (const { cells, example } of topic.rows) for (const row of [cells, example].filter(Boolean)) {
            assert.equal(row.length, 6, row.join("|"));
            assert.ok(row.every((cell) => cell && cell === cell.trim() && cell.length <= 120));
        }
        for (let i = 0; i < 6; i++) assert.equal(new Set(topic.rows.map((r) => r.cells[i].toLowerCase())).size, topic.rows.length, `${topic.id} ${i}`);
    }
    assert.equal(suggest("dog", "word", "English", "Spanish")[0].translation, "el perro");
    assert.equal(suggest("perro", "translation", "Russian", "Spanish")[0].word, "собака");
    assert.deepEqual(suggest("dog", "word", "English", "Polish"), []);
    assert.equal(nextTopic("English", "Spanish", new Set([libraryKey("basics", "English", "Spanish")])).id, "phrases");
    assert.ok(topicWords(topics.find((x) => x.id === "verbs"), "English", "German").every((w) => w.example));
});
test("achievements and advice", () => {
    const day = (answers, correct = answers) => ({ answers, correct, fresh: 0, seconds: 0 });
    const log = { "2026-02-27": day(5), "2026-02-28": day(20), "2026-03-01": day(1, 0), "2026-03-05": day(1), "2026-03-06": day(0) };
    assert.equal(bestStreak(log), 3);
    const done = getAchievements({ log, mastered: 9, words: 200, dailyGoal: 20 }).filter((b) => b.done).map((b) => b.id);
    assert.deepEqual(done, ["first", "streak3", "words200", "sharp"]);
    const facts = { hasActive: true, hasDictionaries: true, dueElsewhere: 0, difficult: 0, activeFinished: false, hasNextTopic: true, answers: 0, lastBackup: null };
    assert.deepEqual(getAdvice(facts), []);
    assert.deepEqual(getAdvice({ ...facts, dueElsewhere: 2, difficult: 3, answers: 99 }), ["review", "difficult"]);
    assert.deepEqual(getAdvice({ ...facts, activeFinished: true, answers: 99 }), ["next", "backup"]);
});
test("both interface languages have the same keys", () => assert.deepEqual(Object.keys(en).sort(), Object.keys(ru).sort()));
test("games: unique pairs, sentences, statements", async () => {
    const make = (list) => list.map(([word, translation, example], id) => ({ id, word, translation, example }));
    const words = make([["cat", "gato"], ["cat", "minino"], ["sun", "sol"], ["Sun", "sol"], ["go", "ir", "Vamos a casa. — We go home."]]);
    for (let i = 0; i < 50; i++) {
        const pairs = pickPairs(words, 5);
        assert.equal(pairs.length, 3);
        const s = buildStatement(words, 0);
        if (!s.truth) assert.ok(!words.some((w) => normalize(w.word) === normalize(s.word.word) && normalize(w.translation) === normalize(s.shown)));
        const [sentence] = buildSentences(words, 5);
        assert.equal(sentence.prompt, "We go home.");
        assert.ok(isSentence(sentence, sentence.parts) && !isSentence(sentence, sentence.shuffled));
    }
    assert.deepEqual(tokens("Tu es libre ?"), ["Tu", "es", "libre ?"]);
    for (const topic of await loadLibrary()) for (const to of LIBRARY_LANGUAGES.slice(1)) {
        for (const s of buildSentences(topicWords(topic, "English", to), 999)) assert.ok(isSentence(s, s.parts));
    }
});
