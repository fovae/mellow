import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { buildSentences, buildStatement, isSentence, pickPairs } from "../core/games.js";
import { shuffle } from "../core/quiz.js";
import { speak } from "../core/speech.js";
import { getDictionary, getState, recordTestAnswer, saveRecord } from "../core/store.js";
import { languageCode, languageName } from "../data/languages.js";
import { openFullscreen } from "./modal.js";
import { icon } from "./icons.js";
import { statTile } from "./parts.js";

const PAIRS = 5;
const ROUNDS = 3;
const SENTENCES = 8;
const SPRINT_SECONDS = 60;

const header = (screen, fill, count) => h("header", { class: "session-header" },
    h("button", { class: "icon-btn", type: "button", "aria-label": t("common.close"), onClick: screen.close }, icon("close")),
    h("div", { class: "bar" }, h("div", { class: "bar-fill", style: { width: `${fill * 100}%` } })),
    h("span", { class: "muted session-count" }, count));

function drawEnd(screen, { title, text, tiles, again }) {
    screen.draw(header(screen, 1, ""),
        h("div", { class: "session-summary" },
            h("div", { class: "summary-emoji" }, "🎉"),
            h("h2", { class: "screen-title" }, title),
            text && h("p", { class: "muted" }, text),
            h("div", { class: "stats-grid" }, tiles)),
        h("div", { class: "session-footer" },
            h("button", { class: "btn btn-soft", type: "button", onClick: () => { screen.close(); again(); } }, t("tests.again")),
            h("button", { class: "btn btn-primary", type: "button", onClick: screen.close }, t("common.done"))));
}

const autoSpeak = (text, dict) => getState().settings.autoSpeak && speak(text, dict.to);
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
        const words = rounds[round];
        const missed = new Set();
        let left = words.length;
        let picked = null; // { word, side, el }
        const top = h("div");
        const drawTop = () => top.replaceChildren(header(screen, done / total, `${done} / ${total}`));

        const choose = (word, side, el) => {
            if (!picked || picked.side === side) {
                picked?.el.classList.remove("is-picked");
                picked?.el.setAttribute("aria-pressed", "false");
                picked = picked?.el === el ? null : { word, side, el };
                if (picked) {
                    el.classList.add("is-picked");
                    el.setAttribute("aria-pressed", "true");
                }
                return;
            }
            const first = picked;
            picked = null;
            first.el.classList.remove("is-picked");
            first.el.setAttribute("aria-pressed", "false");
            if (first.word === word) {
                for (const node of [first.el, el]) { node.disabled = true; node.classList.add("is-matched"); }
                recordTestAnswer(dictId, word.id, !missed.has(word.id));
                autoSpeak(word.translation, dict);
                done++;
                drawTop();
                if (--left === 0) setTimeout(nextRound, 450);
            } else {
                mistakes++;
                missed.add(first.word.id).add(word.id);
                for (const node of [first.el, el]) {
                    node.classList.add("is-wrong", "is-shaking");
                    setTimeout(() => node.classList.remove("is-wrong", "is-shaking"), 420);
                }
            }
        };
        const column = (side) => h("div", { class: "pairs-column" }, shuffle(words).map((word) => {
            const el = h("button", { class: "option pair", type: "button", "aria-pressed": "false", lang: languageCode(side === "word" ? dict.from : dict.to), onClick: () => choose(word, side, el) }, word[side]);
            return el;
        }));
        drawTop();
        screen.draw(top, h("p", { class: "muted session-hint" }, t("games.pairsHint")), h("div", { class: "pairs" }, column("word"), column("translation")));
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
        const chosen = []; // positions in `shuffled`
        let checked = false;
        const line = h("div", { class: "sentence-line", role: "group", "aria-label": t("tests.answer") });
        const bank = h("div", { class: "sentence-bank" });
        const feedback = h("p", { class: "feedback", role: "status" });
        const action = h("button", { class: "btn btn-primary", type: "button", onClick: () => (checked ? next() : check()) });

        const chip = (position, onClick, used = false) => h("button", {
            class: `chip ${used ? "is-used" : ""}`, type: "button", disabled: used || checked, onClick,
        }, sentence.shuffled[position]);
        const drawParts = () => {
            line.replaceChildren(...chosen.map((position, i) => chip(position, () => { chosen.splice(i, 1); drawParts(); })));
            bank.replaceChildren(...sentence.shuffled.map((_, position) =>
                chip(position, () => { chosen.push(position); drawParts(); }, chosen.includes(position))));
            action.textContent = t(checked ? "tests.next" : "tests.check");
            action.disabled = !checked && chosen.length < sentence.shuffled.length;
        };
        function check() {
            checked = true;
            const right = isSentence(sentence, chosen.map((position) => sentence.shuffled[position]));
            if (right) correct++;
            recordTestAnswer(dictId, sentence.wordId, right);
            line.classList.add(right ? "is-correct" : "is-wrong");
            feedback.classList.add(right ? "is-correct" : "is-wrong");
            feedback.textContent = right ? t("tests.correct") : t("tests.wrong", { answer: sentence.answer });
            autoSpeak(sentence.answer, dict);
            drawParts();
            action.focus({ preventScroll: true, focusVisible: false });
        }
        const next = () => { index++; draw(); };

        drawParts();
        screen.draw(header(screen, index / list.length, `${index + 1} / ${list.length}`),
            h("div", { class: "question" }, h("span", { class: "flashcard-label" }, languageName(dict.to, getLocale())), h("h2", { class: "question-word sentence-prompt" }, sentence.prompt)),
            line, bank, feedback, h("div", { class: "session-footer" }, action));
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
        top.replaceChildren(header(screen, left / SPRINT_SECONDS, t("time.seconds", { count: left })));
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
