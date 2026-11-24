import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { buildSentences, buildStatement, pickPairs } from "../core/games.js";
import { play } from "../core/sound.js";
import { countGame, getDictionary, recordTestAnswer, saveRecord } from "../core/store.js";
import { pairsBoard, sentenceExercise } from "./exercises.js";
import { openFullscreen } from "./modal.js";
import { icon } from "./icons.js";
import { mascot } from "./mascot.js";
import { sessionHeader, statTile } from "./parts.js";
import { confetti } from "./toast.js";

const PAIRS = 5;
const ROUNDS = 3;
const SENTENCES = 8;
const SPRINT_SECONDS = 60;


function drawEnd(screen, { title, text, tiles, again }) {
    screen.draw(sessionHeader(screen.close, 1),
        h("div", { class: "session-summary" },
            mascot("happy", "mascot-large"),
            h("h2", { class: "screen-title" }, title),
            text && h("p", { class: "muted" }, text),
            h("div", { class: "stats-grid" }, tiles)),
        h("div", { class: "session-footer" },
            h("button", { class: "btn btn-soft", type: "button", onClick: () => { screen.close(); again(); } }, t("tests.again")),
            h("button", { class: "btn btn-primary", type: "button", onClick: screen.close }, t("common.done"))));
    play("done");
    if (text) confetti(screen.body);
    countGame();
}

const recordText = (isBest) => (isBest ? t("games.record") : "");

export const canPlayPairs = (dict) => pickPairs(dict.words, PAIRS).length >= 3;
export const canPlaySentences = (dict) => buildSentences(dict.words, 1).length > 0;
export const canPlaySprint = (dict) => pickPairs(dict.words, 4).length >= 4;

export function openPairs(dictId) {
    const dict = getDictionary(dictId);
    const screen = openFullscreen(t("games.pairs"));
    const all = pickPairs(dict.words, PAIRS * ROUNDS);
    const rounds = [];
    for (let i = 0; i < all.length; i += PAIRS) rounds.push(all.slice(i, i + PAIRS));
    // A round of one pair is not a game.
    if (rounds.length > 1 && rounds.at(-1).length < 2) rounds.pop();
    const total = rounds.flat().length;
    const started = Date.now();
    let round = 0;
    let done = 0;
    let mistakes = 0;

    function draw() {
        const top = h("div");
        const drawTop = () => top.replaceChildren(sessionHeader(screen.close, done / total, `${done} / ${total}`));
        drawTop();
        screen.draw(top, h("p", { class: "muted session-hint" }, t("games.pairsHint")), pairsBoard({
            words: rounds[round], dict,
            onMatch: (word, clean) => { done++; recordTestAnswer(dictId, word.id, clean); drawTop(); },
            onMistake: () => mistakes++,
            onDone: nextRound,
        }));
    }

    function nextRound() {
        if (!screen.isOpen()) return;
        if (++round < rounds.length) return draw();
        const seconds = Math.round((Date.now() - started) / 1000);
        // Only full games are comparable.
        const best = total === PAIRS * ROUNDS && saveRecord("pairs", seconds, (a, b) => a < b);
        drawEnd(screen, {
            title: t("games.done"), text: recordText(best), again: () => openPairs(dictId),
            tiles: [statTile(t("time.seconds", { count: seconds }), t("games.time")), statTile(mistakes, t("games.mistakes"))],
        });
    }
    draw();
}

export function openSentences(dictId) {
    const dict = getDictionary(dictId);
    const screen = openFullscreen(t("games.sentences"));
    const list = buildSentences(dict.words, SENTENCES);
    let index = 0;
    let correct = 0;

    function draw() {
        if (index >= list.length) {
            return drawEnd(screen, {
                title: t("tests.resultTitle", { correct, total: list.length }), again: () => openSentences(dictId),
                tiles: [statTile(correct, t("games.right")), statTile(list.length - correct, t("games.mistakes"))],
            });
        }
        const sentence = list[index];
        screen.draw(sessionHeader(screen.close, index / list.length, `${index + 1} / ${list.length}`), ...sentenceExercise({
            sentence, dict,
            onAnswer: (right) => {
                if (right) correct++;
                recordTestAnswer(dictId, sentence.wordId, right);
            },
            onNext: () => { index++; draw(); },
        }));
    }
    draw();
}

export function openSprint(dictId) {
    const dict = getDictionary(dictId);
    const words = pickPairs(dict.words, dict.words.length);
    const screen = openFullscreen(t("games.sprint"), (event) => {
        if (event.repeat) return;
        if (event.key === "ArrowLeft") answer?.(false);
        if (event.key === "ArrowRight") answer?.(true);
    });
    const end = Date.now() + SPRINT_SECONDS * 1000;
    let score = 0;
    let mistakes = 0;
    let last = null;
    let answer = null;
    let locked = false;

    const top = h("div");
    const body = h("div", { class: "sprint" });
    const footer = h("div", { class: "session-footer" },
        h("button", { class: "btn btn-danger-soft", type: "button", onClick: () => answer?.(false) }, icon("close"), t("games.no")),
        h("button", { class: "btn btn-primary", type: "button", onClick: () => answer?.(true) }, icon("check"), t("games.yes")));

    function ask() {
        const statement = buildStatement(words, last);
        last = statement.word.id;
        body.className = "sprint";
        body.replaceChildren(h("h2", { class: "question-word" }, statement.word.word), h("p", { class: "sprint-answer" }, statement.shown));
        answer = (value) => {
            if (locked) return;
            locked = true;
            const right = value === statement.truth;
            if (right) score++;
            else mistakes++;
            recordTestAnswer(dictId, statement.word.id, right);
            play(right ? "right" : "wrong");
            body.classList.add(right ? "is-correct" : "is-wrong");
            if (!right) body.append(h("p", { class: "muted" }, `${statement.word.word} — ${statement.word.translation}`));
            // A mistake stays longer, so the right pair can be read.
            setTimeout(() => {
                locked = false;
                if (answer && screen.isOpen()) ask();
            }, right ? 220 : 1300);
        };
    }

    function tick() {
        if (!screen.isOpen()) return clearInterval(timer);
        const left = Math.max(0, Math.ceil((end - Date.now()) / 1000));
        top.replaceChildren(sessionHeader(screen.close, left / SPRINT_SECONDS, t("time.seconds", { count: left })));
        if (left) return;
        clearInterval(timer);
        answer = null;
        const best = score > 0 && saveRecord("sprint", score, (a, b) => a > b);
        drawEnd(screen, {
            title: t("games.timeUp"), text: recordText(best), again: () => openSprint(dictId),
            tiles: [statTile(score, t("games.right")), statTile(mistakes, t("games.mistakes"))],
        });
    }

    const timer = setInterval(tick, 250);
    screen.draw(top, h("p", { class: "muted session-hint" }, t("games.sprintHint")), body, footer);
    tick();
    ask();
}
