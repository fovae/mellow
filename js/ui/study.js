import { art } from "./art.js";
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { schedule, pickNext } from "../core/srs.js";

const ANSWERS = [["again", "study.forgot"], ["good", "study.remember"]];
import { findWord, getScopeDictionaries, getScopeQueue, getScopeWords, getNewLeft, getState, gradeWord } from "../core/store.js";
import { hintMask } from "../core/quiz.js";
import { play } from "../core/sound.js";
import { speak } from "../core/speech.js";
import { calmMotion } from "../core/theme.js";
import { openFullscreen } from "./modal.js";
import { languageName } from "../data/languages.js";
import { mascot } from "./mascot.js";
import { icon } from "./icons.js";
import { speakButton, statTile, topicName } from "./parts.js";

const SWIPE = 90; // px
const REVEAL_MS = 650; // an answer chosen before turning the card: the answer is shown this long
const FLY_MS = 300; // the card flying off (css/components.css)
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, calmMotion() ? Math.min(ms, 350) : ms));

function previewInterval(srs, grade) {
    const next = schedule(srs, grade);
    return next.interval
        ? t("time.days", { count: next.interval })
        : t("time.minutes", { count: Math.max(1, Math.round((next.due - Date.now()) / 60000)) });
}

// Left = again, right = good, on either side of the card. While dragging, a stamp on the card and the matching
// button show what letting go will do (--good / --again: 0..1).
function attachSwipe(card, onGrade) {
    let start = null;
    const pull = (dx) => {
        const amount = Math.min(1, Math.abs(dx) / SWIPE);
        card.style.setProperty("--good", dx > 0 ? amount : 0);
        card.style.setProperty("--again", dx < 0 ? amount : 0);
        card.dataset.swipe = dx > SWIPE ? "good" : dx < -SWIPE ? "again" : "";
    };
    const reset = () => {
        start = null;
        card.classList.remove("is-dragging");
        card.style.transform = "";
        pull(0);
        delete card.dataset.swipe;
    };
    card.addEventListener("pointerdown", (event) => {
        if (event.isPrimary && !card.classList.contains("is-gone") && !event.target.closest(".icon-btn")) start = { x: event.clientX, moved: false };
    });
    card.addEventListener("pointermove", (event) => {
        if (!start) return;
        const dx = event.clientX - start.x;
        if (!start.moved && Math.abs(dx) < 10) return;
        if (!start.moved) {
            start.moved = true;
            card.classList.add("is-dragging");
            card.setPointerCapture(event.pointerId);
        }
        card.style.transform = `translateX(${dx}px) rotate(${dx / 24}deg)`;
        pull(dx);
    });
    card.addEventListener("pointerup", (event) => {
        if (!start?.moved) return void (start = null);
        const dx = event.clientX - start.x;
        card.dataset.swiped = "1"; // the click that follows must not flip the card
        setTimeout(() => delete card.dataset.swiped, 50);
        if (Math.abs(dx) > SWIPE) {
            start = null;
            card.classList.remove("is-dragging");
            onGrade(dx > 0 ? "good" : "again");
        } else reset();
    });
    card.addEventListener("pointercancel", reset);
}

// The first time: a small picture of a card swiped both ways, over the real card. Once per device.
const TUTORIAL_KEY = "mellow_cards_tutorial";
function swipeTutorial(onDone) {
    const ns = "http://www.w3.org/2000/svg";
    const el = (tag, attrs, ...children) => {
        const node = document.createElementNS(ns, tag);
        for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
        node.append(...children);
        return node;
    };
    const picture = el("svg", { viewBox: "0 0 240 150", class: "swipe-picture", "aria-hidden": "true" },
        el("g", { class: "swipe-side swipe-side-again" }, el("circle", { cx: 26, cy: 70, r: 18 }), el("path", { d: "M19 63l14 14M33 63L19 77" })),
        el("g", { class: "swipe-side swipe-side-good" }, el("circle", { cx: 214, cy: 70, r: 18 }), el("path", { d: "M206 70l6 6 11-12" })),
        el("g", { class: "swipe-card" },
            el("rect", { x: 78, y: 22, width: 84, height: 100, rx: 16, class: "swipe-card-body" }),
            el("rect", { x: 96, y: 58, width: 48, height: 8, rx: 4, class: "swipe-card-line" }),
            el("rect", { x: 104, y: 74, width: 32, height: 6, rx: 3, class: "swipe-card-line is-light" })),
        el("g", { class: "swipe-finger" }, el("circle", { cx: 120, cy: 112, r: 15, class: "swipe-finger-ring" }), el("circle", { cx: 120, cy: 112, r: 8, class: "swipe-finger-dot" })));
    let overlay;
    const close = () => {
        localStorage.setItem(TUTORIAL_KEY, "1");
        overlay.classList.add("is-leaving");
        setTimeout(() => { overlay.remove(); onDone?.(); }, calmMotion() ? 0 : 220);
    };
    overlay = h("div", { class: "swipe-tutorial", role: "dialog", "aria-label": t("study.tutorialTitle") },
        picture,
        h("div", { class: "swipe-legend", "aria-hidden": "true" },
            h("span", { class: "swipe-legend-again" }, "← ", t("study.forgot")), h("span", { class: "swipe-legend-good" }, t("study.remember"), " →")),
        h("strong", { class: "swipe-title" }, t("study.tutorialTitle")),
        h("p", { class: "muted" }, t("study.tutorialText")),
        h("button", { class: "btn btn-primary", type: "button", onClick: close }, t("study.tutorialOk")));
    return localStorage.getItem(TUTORIAL_KEY) ? null : overlay;
}

// scope: a dictionary id, or null for all dictionaries.
export function openStudy(scope) {
    const history = []; // { wordId, grade, undo }
    let word = null;
    let dictId = null;
    let flip = () => {};
    let choose = () => {};
    let flipped = false;

    const screen = openFullscreen(t("cards.title"), (event) => {
        if (!word || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
        const grade = { 1: "again", 2: "good", ArrowLeft: "again", ArrowRight: "good" }[event.key];
        if (document.querySelector(".swipe-tutorial")) return;
        if (grade) choose(grade);
        else if (event.key === " " && !event.target.closest("button")) {
            event.preventDefault();
            flip();
        }
    });

    function answer(grade) {
        const undo = gradeWord(dictId, word.id, grade);
        if (undo) history.push({ wordId: word.id, grade, undo });
        next();
    }

    function takeBack() {
        const last = history.pop();
        last.undo();
        next(last.wordId);
    }

    function next(wordId) {
        if (!getScopeDictionaries(scope).length) return screen.close();
        word = wordId ? findWord(wordId)?.word : pickNext(getScopeWords(scope), getNewLeft(), history.at(-1)?.wordId);
        flipped = false;
        if (!word) return drawSummary();
        const { dict } = findWord(word.id);
        dictId = dict.id;
        drawCard(dict);
    }

    function header() {
        const { due, soon, fresh } = getScopeQueue(scope);
        const left = due.length + soon.length + fresh.length;
        return h("header", { class: "session-header" },
            h("button", { class: "icon-btn", type: "button", "aria-label": t("common.close"), onClick: screen.close }, icon("close")),
            h("div", { class: "bar" }, h("div", { class: "bar-fill", style: { width: `${(history.length / (history.length + left || 1)) * 100}%` } })),
            h("button", { class: "icon-btn", type: "button", "aria-label": t("common.undo"), disabled: !history.length, onClick: takeBack }, icon("undo")));
    }

    function drawCard(dict) {
        const { reverse } = getState().settings;
        const sides = [
            { text: word.word, lang: dict.from },
            { text: word.translation, lang: dict.to },
        ];
        if (reverse) sides.reverse();
        const face = (side, { text, lang }, hidden) => h("div", { class: `flashcard-face flashcard-${side}`, "aria-hidden": String(hidden), inert: hidden },
            h("span", { class: "flashcard-label" }, side === "front" ? t("word.word") : t("word.translation")),
            h("span", { class: "flashcard-word" }, text), speakButton(text, lang));
        const front = face("front", sides[0], false);
        const back = face("back", sides[1], true);
        front.firstChild.textContent = languageName(sides[0].lang, getLocale());
        back.firstChild.textContent = languageName(sides[1].lang, getLocale());

        const card = h("div", { class: "flashcard", onClick: () => card.dataset.swiped || busy || flip() },
            // The 3D turn lives in its own box: moving the box with the perspective itself showed the back face mirrored in WebKit.
            h("div", { class: "flashcard-scene" }, h("div", { class: "flashcard-inner" }, front, back)),
            h("span", { class: "swipe-stamp swipe-stamp-good", "aria-hidden": "true" }, t("study.remember")),
            h("span", { class: "swipe-stamp swipe-stamp-again", "aria-hidden": "true" }, t("study.forgot")));
        // Two answers, as the swipes: "Forgot" (left) and "Remember" (right), always there. The schedule does the rest.
        const grades = h("div", { class: "grades" }, ANSWERS.map(([grade, label]) => h("button", {
            class: `grade grade-${grade}`, type: "button", "data-grade": grade, onClick: () => choose(grade),
        }, h("span", { class: "grade-icon", "aria-hidden": "true" }, icon(grade === "again" ? "close" : "check")),
            h("span", { class: "grade-text" }, h("strong", {}, t(label)), h("small", {}, previewInterval(word.srs, grade))))));
        front.append(h("span", { class: "flashcard-tap", "aria-hidden": "true" }, t("study.tapToFlip")));

        flip = () => {
            flipped = !card.classList.contains("is-flipped");
            card.classList.toggle("is-flipped", flipped);
            front.inert = flipped;
            back.inert = !flipped;
            front.setAttribute("aria-hidden", String(flipped));
            back.setAttribute("aria-hidden", String(!flipped));
            if (flipped && getState().settings.autoSpeak) speak(word.translation, dict.to);
            help.hidden = flipped;
        };
        // An answer before the card was turned: the answer is shown for a moment first, then the card flies off.
        let busy = false;
        choose = async (grade) => {
            if (busy) return;
            busy = true;
            if (!flipped) {
                flip();
                await wait(REVEAL_MS);
            }
            fly(grade);
        };
        // The card leaves to the side of the answer; the next one comes up.
        const fly = (grade) => {
            busy = true;
            play(grade === "again" ? "wrong" : "right");
            grades.dataset.chosen = grade;
            card.classList.add("is-gone", `is-gone-${grade}`);
            card.style.transform = "";
            setTimeout(() => answer(grade), calmMotion() ? 0 : FLY_MS);
        };
        // Each tap opens one more letter; the last one is left to the learner.
        let letters = 0;
        const hint = h("p", { class: "hint-text", role: "status" });
        const help = h("button", {
            class: "hint-btn", type: "button",
            onClick: () => { letters++; hint.textContent = hintMask(sides[1].text, letters); },
        }, icon("bulb"), t("study.help"));
        if (word.example) back.append(h("p", { class: "example" }, word.example));
        if (!scope) front.prepend(h("span", { class: "badge" }, art(dict.emoji), topicName(dict)));
        attachSwipe(card, (grade) => { if (!busy) fly(grade); });
        const tutorial = swipeTutorial(() => card.focus?.());
        screen.draw(header(), h("div", { class: "card-zone" }, card, tutorial), hint, help, h("div", { class: "session-footer" }, grades));
        (tutorial?.querySelector(".btn") ?? grades.children[1]).focus({ preventScroll: true, focusVisible: false });
    }

    function drawSummary() {
        const correct = history.filter((x) => x.grade !== "again").length;
        screen.draw(header(),
            h("div", { class: "session-summary" },
                mascot("happy", "mascot-large"),
                h("h2", { class: "screen-title" }, t("study.doneTitle")),
                h("p", { class: "muted" }, t("study.doneText")),
                h("div", { class: "stats-grid" },
                    statTile(new Set(history.map((x) => x.wordId)).size, t("home.words")),
                    statTile(history.length ? `${Math.round((correct / history.length) * 100)}%` : "—", t("study.accuracy")))),
            h("div", { class: "session-footer" }, h("button", { class: "btn btn-primary", type: "button", onClick: screen.close }, t("common.done"))));
    }

    next();
}
