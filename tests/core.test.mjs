import test from "node:test";
import assert from "node:assert/strict";
import { schedule, pickNext, getStatus, getQueue } from "../js/core/srs.js";
import { startOfDay } from "../js/core/dates.js";
import { parseWords, toCSV, cleanState } from "../js/core/transfer.js";
import { loadLibrary, suggest, nextTopic, libraryKey, topicWords, LIBRARY_LANGUAGES } from "../js/core/library.js";
import { libraryLanguages } from "../js/data/library.js";
import { getAchievements, bestStreak } from "../js/core/achievements.js";
import { currentTopic, listProfiles } from "../js/core/profiles.js";
import { needsBackup } from "../js/core/advice.js";
import { pickPairs, tokens, buildSentences, isSentence, buildStatement } from "../js/core/games.js";
import { dailyQuests, daysToFreeze, emptyDay, levelInfo, levelOf, newRewards, streakOf } from "../js/core/rewards.js";
import { buildLesson, buildPath, splitLessons } from "../js/core/lessons.js";
import { accents } from "../js/core/accents.js";
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
    const defaults = { version: 2, settings: { language: "en", theme: "auto", dailyGoal: 20, newPerDay: 10, paceUnit: "day", reverse: false, autoSpeak: false, sound: true, haptics: true, speechRate: "normal", motion: true, backupReminder: true, accent: "mellow", native: "English", target: "Spanish" } };
    let n = 0;
    const clean = cleanState({
        username: 5, profiles: [5, { from: "Elvish", to: "Spanish" }, { from: "Spanish", to: "English" }], removedTopics: [1, "a:b:c"], settings: { theme: "x", dailyGoal: "a" }, log: { bad: {}, "2026-11-24": { answers: "x", correct: 2 } },
        dictionaries: [null, { id: "d", name: {}, from: "Elvish", words: [null, { id: "w", word: "a", translation: "b", srs: { due: 1, interval: "x" } }, { id: "w", word: "c", translation: "d", srs: 5 }, { word: "", translation: "x" }] }],
    }, defaults, () => `new${n++}`, { languages: ["en"], studyLanguages: ["English", "Spanish"] });
    assert.deepEqual(clean.settings, defaults.settings);
    assert.deepEqual(clean.log, { "2026-11-24": { ...emptyDay(), correct: 2 } });
    const [dict] = clean.dictionaries;
    assert.deepEqual([clean.username, dict.name, dict.from, dict.words.length], ["", "Dictionary", "English", 2]);
    assert.deepEqual(clean.profiles, [{ from: "Spanish", to: "English" }, { from: "English", to: "Spanish" }]);
    assert.deepEqual(clean.removedTopics, ["a:b:c"]);
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
test("achievements and the backup reminder", () => {
    const day = (answers, correct = answers) => ({ answers, correct, fresh: 0, seconds: 0 });
    const log = { "2026-02-27": day(5), "2026-02-28": day(20), "2026-03-01": day(1, 0), "2026-03-05": day(1), "2026-03-06": day(0) };
    assert.equal(bestStreak(log), 3);
    const done = getAchievements({ log, mastered: 9, words: 200, dailyGoal: 20 }).filter((b) => b.done).map((b) => b.id);
    assert.deepEqual(done, ["first", "streak3", "words200", "sharp"]);
    const now = Date.now();
    assert.ok(needsBackup({ answers: 50, lastBackup: null }) && needsBackup({ answers: 50, lastBackup: now - 15 * 86400000, now }));
    assert.ok(!needsBackup({ answers: 49, lastBackup: null }) && !needsBackup({ answers: 99, lastBackup: now - 86400000, now }));
});
test("profiles: unique pairs, topics go in order", () => {
    const pair = (from, to) => ({ from, to });
    assert.deepEqual(listProfiles([pair("a", "b")], [{ ...pair("a", "b"), id: 1 }, pair("b", "a")]), [pair("a", "b"), pair("b", "a")]);
    const dict = (id, ...started) => ({ id, words: started.map((s) => ({ srs: s ? {} : null })) });
    assert.equal(currentTopic([dict(1, true), dict(2, true, false), dict(3, false)]).id, 2);
    assert.equal(currentTopic([dict(1, true), dict(2, true), dict(3)]).id, 2);
    assert.equal(currentTopic([]), undefined);
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
test("the offline list matches the files", async () => {
    const { readFile, readdir, access } = await import("node:fs/promises");
    const root = new URL("../", import.meta.url);
    const listed = [...(await readFile(new URL("sw.js", root), "utf8")).matchAll(/"\.\/([^"]+)"/g)].map((m) => m[1]);
    for (const path of listed) await access(new URL(path, root));
    for (const dir of ["js", "css"]) for (const path of await readdir(new URL(dir, root), { recursive: true })) {
        if (/\.(js|css)$/.test(path)) assert.ok(listed.includes(`${dir}/${path}`), `${dir}/${path} is not in sw.js`);
    }
});
test("levels, quests and rewards", () => {
    assert.deepEqual([0, 49, 50, 149, 150, 300].map(levelOf), [1, 1, 2, 2, 3, 4]);
    assert.deepEqual(levelInfo(60), { level: 2, done: 10, need: 100 });
    const key = "2026-11-24";
    const quests = dailyQuests(key);
    assert.deepEqual(quests, dailyQuests(key));
    assert.equal(new Set(quests.map((q) => q.id)).size, 3);
    const day = { ...emptyDay(), answers: 20, ...Object.fromEntries(quests.map((q) => [q.field, q.goal])) };
    const facts = { key, day, done: [], xp: 50, rewardedLevel: 1, dailyGoal: 20 };
    const first = newRewards(facts);
    assert.deepEqual(first.events.map((e) => e.type), ["quest", "quest", "quest", "chest", "goal", "level"]);
    assert.deepEqual(newRewards({ ...facts, done: first.done, rewardedLevel: 2 }).events, []);
});
test("streak and freezes", () => {
    const day = { ...emptyDay(), answers: 1 };
    const log = { "2026-11-20": day, "2026-11-21": day };
    assert.equal(streakOf(log, {}, now), 0);
    assert.deepEqual(daysToFreeze(log, {}, 2, now), ["2026-11-23", "2026-11-22"]);
    assert.deepEqual(daysToFreeze(log, {}, 1, now), []);
    assert.deepEqual(daysToFreeze({}, {}, 3, now), []);
    assert.deepEqual(daysToFreeze({ "2026-11-23": day }, {}, 3, now), []);
    const frozen = { "2026-11-22": true, "2026-11-23": true };
    assert.equal(streakOf(log, frozen, now), 2);
    assert.equal(streakOf({ ...log, "2026-11-24": day }, frozen, now), 3);
    assert.deepEqual(daysToFreeze(log, frozen, 3, now), []);
});
test("path and lessons", async () => {
    const words = (n) => Array.from({ length: n }, (_, id) => ({ id: `w${id}`, word: `a${id}`, translation: `b${id}`, srs: null }));
    assert.deepEqual([1, 6, 7, 8, 9, 13].map((n) => splitLessons(words(n)).map((l) => l.length).join()), ["1", "6", "7", "8", "6,3", "6,7"]);
    assert.deepEqual(buildPath([]), []);
    const list = words(30);
    list.slice(0, 6).forEach((w) => { w.srs = { interval: 30 }; });
    const path = buildPath(list);
    assert.deepEqual(path.map((n) => n.type).join(), "lesson,lesson,lesson,lesson,test,lesson");
    assert.ok(path[0].mastered && path[1].current && !path[2].current && !path[4].done);
    for (const n of [1, 2, 6]) for (const speech of [true, false]) {
        const steps = buildLesson(words(n), words(n), { speech });
        assert.equal(steps.filter((s) => s.type === "intro").length, n);
        for (const s of steps) if (s.type === "question") assert.ok(s.mode === "typing" || s.question.options.length > 1);
        for (const w of words(n)) assert.ok(steps.filter((s) => s.wordId === w.id).length >= 3);
    }
    for (const topic of await loadLibrary()) {
        const all = topicWords(topic, "Russian", "Italian").map((w, id) => ({ ...w, id: `x${id}`, srs: null }));
        for (const lesson of splitLessons(all)) buildLesson(lesson, all, { speech: true });
    }
});
test("colour styles have readable contrast", async () => {
    const { readFile } = await import("node:fs/promises");
    const css = await readFile(new URL("../css/themes.css", import.meta.url), "utf8");
    const rgb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const mix = (a, b, part) => a.map((x, i) => x * part + b[i] * (1 - part));
    const light = (c) => c.map((x) => x / 255).map((x) => (x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)).reduce((s, x, i) => s + x * [0.2126, 0.7152, 0.0722][i], 0);
    const contrast = (a, b) => { const [x, y] = [light(a), light(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
    const white = [255, 255, 255];
    for (const { id } of accents) {
        const [, g1, g2, accent] = css.match(new RegExp(`\\[data-accent="${id}"\\] \\{ --g1: (#\\w+); --g2: (#\\w+); --accent: (#\\w+)`)).map((x, i) => (i ? rgb(x) : x));
        const dark = rgb(css.match(new RegExp(`dark"\\]\\[data-accent="${id}"\\] \\{ --accent: (#\\w+)`))[1]);
        assert.ok(contrast(white, g1) >= 4.5 && contrast(white, g2) >= 4.5, `${id} gradient`);
        assert.ok(contrast(accent, mix(accent, white, 0.12)) >= 4.5, `${id} light`);
        assert.ok(contrast(dark, mix(dark, rgb("#1a1b26"), 0.18)) >= 4.5, `${id} dark`);
    }
});
test("every emoji in the data has a picture", async () => {
    const { hasArt } = await import("../js/ui/art.js");
    const { dictionaryIcons } = await import("../js/data/languages.js");
    const names = [...(await loadLibrary()).map((x) => x.emoji), ...dictionaryIcons, ...getAchievements({ log: {}, mastered: 0, words: 0, dailyGoal: 1 }).map((b) => b.emoji)];
    assert.deepEqual(names.filter((name) => !hasArt(name)), []);
});

test("sw.js carries the app version, so every release is offered as an update", async () => {
    const { readFile } = await import("node:fs/promises");
    const { APP_VERSION } = await import("../js/core/version.js");
    const sw = await readFile(new URL("../sw.js", import.meta.url), "utf8");
    assert.equal(sw.match(/const VERSION = "([^"]+)"/)?.[1], APP_VERSION);
});

test("answers: punctuation, dashes and ё never make an answer wrong", () => {
    const q = { accepted: ["Всё хорошо, спасибо", "peut-être", "How are you?"] };
    for (const text of ["все хорошо спасибо", "Всё хорошо, спасибо.", "всё хорошо — спасибо", "peut etre", "peut-être", "how are you", "How are you?!"]) assert.ok(isCorrect(q, text), text);
    assert.ok(!isCorrect(q, "все плохо"));
    assert.ok(!isCorrect(q, "..."));
});
