import test from "node:test";
import assert from "node:assert/strict";
import { schedule, pickNext, getStatus, getQueue } from "../js/core/srs.js";
import { startOfDay } from "../js/core/dates.js";
import { buildQuiz, isCorrect, normalize } from "../js/core/quiz.js";

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
