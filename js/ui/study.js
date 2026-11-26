import { art } from "./art.js";
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { GRADES, schedule, pickNext } from "../core/srs.js";
import { findWord, getScopeDictionaries, getScopeQueue, getScopeWords, getNewLeft, getState, gradeWord } from "../core/store.js";
import { hintMask } from "../core/quiz.js";
import { play } from "../core/sound.js";
import { speak } from "../core/speech.js";
import { openFullscreen } from "./modal.js";
import { languageName } from "../data/languages.js";
import { mascot } from "./mascot.js";
import { icon } from "./icons.js";
import { speakButton, statTile, topicName } from "./parts.js";

const SWIPE = 90; // px

function previewInterval(srs, grade) {
    const next = schedule(srs, grade);
    return next.interval
        ? t("time.days", { count: next.interval })
        : t("time.minutes", { count: Math.max(1, Math.round((next.due - Date.now()) / 60000)) });
}

// Left = again, right = good. Works only on the answer side.
function attachSwipe(card, canSwipe, onGrade) {
    let start = null;
    const reset = () => {
        start = null;
        card.style.transform = "";
        delete card.dataset.swipe;
    };
    card.addEventListener("pointerdown", (event) => {
        if (canSwipe() && event.isPrimary && !event.target.closest(".icon-btn")) start = { x: event.clientX, y: event.clientY, moved: false };
    });
    card.addEventListener("pointermove", (event) => {
        if (!start) return;
        const dx = event.clientX - start.x;
        if (!start.moved && Math.abs(dx) < 10) return;
        if (!start.moved) {
            start.moved = true;
            card.setPointerCapture(event.pointerId);
        }
        card.style.transform = `translateX(${dx}px) rotate(${dx / 24}deg)`;
        card.dataset.swipe = dx > SWIPE ? "good" : dx < -SWIPE ? "again" : "";
    });
    card.addEventListener("pointerup", (event) => {
        if (!start?.moved) return void (start = null);
        const dx = event.clientX - start.x;
        reset();
        card.dataset.swiped = "1"; // the click that follows must not flip the card
        setTimeout(() => delete card.dataset.swiped, 50);
        if (Math.abs(dx) > SWIPE) onGrade(dx > 0 ? "good" : "again");
    });
    card.addEventListener("pointercancel", reset);
}

// scope: a dictionary id, or null for all dictionaries.
export function openStudy(scope) {
    const history = []; // { wordId, grade, undo }
    let word = null;
    let dictId = null;
    let flip = () => {};
    let flipped = false;

    const screen = openFullscreen(t("cards.title"), (event) => {
        if (!word || event.repeat || event.metaKey || event.ctrlKey || event.altKey) return;
        const grade = GRADES[Number(event.key) - 1];
        if (grade && flipped) answer(grade);
        else if (event.key === " " && !event.target.closest("button")) {
            event.preventDefault();
            flip();
        }
    });

    function answer(grade) {
        const undo = gradeWord(dictId, word.id, grade);
        play(grade === "again" ? "wrong" : "right");
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

        const card = h("div", { class: "flashcard", onClick: () => card.dataset.swiped || flip() }, h("div", { class: "flashcard-inner" }, front, back));
        const show = h("button", { class: "btn btn-primary", type: "button", onClick: () => flip() }, t("study.show"));
        const grades = h("div", { class: "grades", hidden: true }, GRADES.map((grade) => h("button", {
            class: `grade grade-${grade}`, type: "button", onClick: () => answer(grade),
        }, h("strong", {}, t(`grade.${grade}`)), h("small", {}, previewInterval(word.srs, grade)))));

        flip = () => {
            flipped = !card.classList.contains("is-flipped");
            card.classList.toggle("is-flipped", flipped);
            front.inert = flipped;
            back.inert = !flipped;
            front.setAttribute("aria-hidden", String(flipped));
            back.setAttribute("aria-hidden", String(!flipped));
            // Grades stay available after the first look at the answer.
            if (flipped && getState().settings.autoSpeak) speak(word.translation, dict.to);
            help.hidden = flipped;
            show.hidden = true;
            grades.hidden = false;
            if (flipped) grades.children[2].focus({ preventScroll: true, focusVisible: false });
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
        attachSwipe(card, () => flipped, answer);
        screen.draw(header(), card, hint, help, h("p", { class: "muted session-hint" }, t("study.hint")), h("div", { class: "session-footer" }, show, grades));
        show.focus({ preventScroll: true, focusVisible: false });
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
