import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { GRADES, schedule, pickNext } from "../core/srs.js";
import { getDictionary, getDictQueue, getNewLeft, getState, gradeWord } from "../core/store.js";
import { openFullscreen } from "./modal.js";
import { icon } from "./icons.js";
import { speakButton, statTile } from "./parts.js";

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

export function openStudy(dictId) {
    const history = []; // { wordId, grade, undo }
    let word = null;
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
        if (undo) history.push({ wordId: word.id, grade, undo });
        next();
    }

    function takeBack() {
        const last = history.pop();
        last.undo();
        next(last.wordId);
    }

    function next(wordId) {
        const dict = getDictionary(dictId);
        if (!dict) return screen.close();
        word = wordId ? dict.words.find((w) => w.id === wordId) : pickNext(dict.words, getNewLeft(), history.at(-1)?.wordId);
        flipped = false;
        if (word) drawCard(dict);
        else drawSummary();
    }

    function header(dict) {
        const { due, soon, fresh } = getDictQueue(dict);
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
        front.firstChild.textContent = t(reverse ? "word.translation" : "word.word");
        back.firstChild.textContent = t(reverse ? "word.word" : "word.translation");

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
            show.hidden = true;
            grades.hidden = false;
            if (flipped) grades.children[2].focus({ preventScroll: true, focusVisible: false });
        };
        attachSwipe(card, () => flipped, answer);
        screen.draw(header(dict), card, h("p", { class: "muted session-hint" }, t("study.hint")), h("div", { class: "session-footer" }, show, grades));
        show.focus({ preventScroll: true, focusVisible: false });
    }

    function drawSummary() {
        const correct = history.filter((x) => x.grade !== "again").length;
        screen.draw(header(getDictionary(dictId)),
            h("div", { class: "session-summary" },
                h("div", { class: "summary-emoji" }, "✨"),
                h("h2", { class: "screen-title" }, t("study.doneTitle")),
                h("p", { class: "muted" }, t("study.doneText")),
                h("div", { class: "stats-grid" },
                    statTile(new Set(history.map((x) => x.wordId)).size, t("home.words")),
                    statTile(history.length ? `${Math.round((correct / history.length) * 100)}%` : "—", t("study.accuracy")))),
            h("div", { class: "session-footer" }, h("button", { class: "btn btn-primary", type: "button", onClick: screen.close }, t("common.done"))));
    }

    next();
}
