// Exercises shared by tests, games and lessons. Each one calls back once with the result.
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { hintMask, isCorrect, shuffle } from "../core/quiz.js";
import { isSentence } from "../core/games.js";
import { play } from "../core/sound.js";
import { speak } from "../core/speech.js";
import { getState } from "../core/store.js";
import { languageCode, languageName } from "../data/languages.js";
import { icon } from "./icons.js";

export const autoSpeak = (text, dict) => getState().settings.autoSpeak && speak(text, dict.to);

const nextButton = (onNext) => h("button", { class: "btn btn-primary", type: "button", onClick: onNext }, t("tests.next"));

// mode: choice | typing | listen. Listening is asked by sound and answered with the meaning.
export function questionExercise({ question, mode, reverse, dict, onAnswer, onNext }) {
    const listen = mode === "listen";
    const playPrompt = () => speak(question.prompt, dict.to);
    const word = h("h2", { class: "question-word", hidden: listen }, question.prompt);
    const feedback = h("p", { class: "feedback", role: "status" });
    const footer = h("div", { class: "session-footer" });
    let answered = false;

    const finish = (text) => {
        if (answered) return false;
        answered = true;
        const correct = isCorrect(question, text);
        play(correct ? "right" : "wrong");
        word.hidden = false;
        help.hidden = true;
        feedback.textContent = correct ? t("tests.correct") : t("tests.wrong", { answer: question.answer });
        feedback.classList.add(correct ? "is-correct" : "is-wrong");
        onAnswer(correct);
        const next = nextButton(onNext);
        footer.replaceChildren(next);
        // After Enter in the form: do not let the same key press activate the button.
        setTimeout(() => next.focus({ preventScroll: true, focusVisible: false }), 0);
        return true;
    };

    let letters = 0;
    const help = h("button", {
        class: "hint-btn", type: "button",
        onClick: () => {
            if (mode === "typing") return void (feedback.textContent = hintMask(question.answer, ++letters));
            // Leave the right answer and one wrong one.
            const wrong = [...body.children].filter((el) => !isCorrect(question, el.textContent));
            wrong.slice(1).forEach((el) => { el.disabled = true; el.classList.add("is-removed"); });
            help.hidden = true;
        },
    }, icon("bulb"), t("study.help"));
    if (mode !== "typing" && question.options.length < 3) help.hidden = true;

    let body;
    if (mode === "typing") {
        const input = h("input", { class: "input input-large", placeholder: t("tests.answer"), "aria-label": t("tests.answer"), autocomplete: "off", autocapitalize: "off", autocorrect: "off", spellcheck: "false" });
        body = h("form", {
            class: "form", id: "answerForm",
            onSubmit: (event) => {
                event.preventDefault();
                if (!input.value.trim() || !finish(input.value)) return;
                input.readOnly = true;
                input.classList.add(feedback.classList.contains("is-correct") ? "is-correct" : "is-wrong");
            },
        }, input);
        footer.append(h("button", { class: "btn btn-primary", type: "submit", form: "answerForm" }, t("tests.check")));
        setTimeout(() => input.focus({ preventScroll: true }), 0);
    } else {
        body = h("div", { class: "options" }, question.options.map((option) => h("button", {
            class: "option", type: "button",
            onClick: (event) => {
                if (!finish(option)) return;
                if (!isCorrect(question, option)) event.currentTarget.classList.add("is-wrong");
                for (const el of body.children) {
                    el.disabled = true;
                    if (isCorrect(question, el.textContent)) el.classList.add("is-correct");
                }
            },
        }, option)));
    }
    if (listen) playPrompt();
    return [
        h("div", { class: "question" },
            h("span", { class: "flashcard-label" }, languageName(reverse ? dict.from : dict.to, getLocale())),
            listen && h("button", { class: "listen-btn", type: "button", "aria-label": t("common.listen"), onClick: playPrompt }, icon("sound")), word),
        body, feedback, help, footer,
    ];
}

export function sentenceExercise({ sentence, dict, onAnswer, onNext }) {
    const chosen = []; // positions in `shuffled`
    let checked = false;
    const line = h("div", { class: "sentence-line", role: "group", "aria-label": t("tests.answer") });
    const bank = h("div", { class: "sentence-bank" });
    const feedback = h("p", { class: "feedback", role: "status" });
    const action = h("button", { class: "btn btn-primary", type: "button", onClick: () => (checked ? onNext() : check()) });
    const chip = (position, onClick, used = false) => h("button", {
        class: `chip ${used ? "is-used" : ""}`, type: "button", disabled: used || checked, onClick,
    }, sentence.shuffled[position]);
    const draw = () => {
        line.replaceChildren(...chosen.map((position, i) => chip(position, () => { chosen.splice(i, 1); draw(); })));
        bank.replaceChildren(...sentence.shuffled.map((_, position) =>
            chip(position, () => { chosen.push(position); draw(); }, chosen.includes(position))));
        action.textContent = t(checked ? "tests.next" : "tests.check");
        action.disabled = !checked && chosen.length < sentence.shuffled.length;
    };
    function check() {
        checked = true;
        const right = isSentence(sentence, chosen.map((position) => sentence.shuffled[position]));
        play(right ? "right" : "wrong");
        line.classList.add(right ? "is-correct" : "is-wrong");
        feedback.classList.add(right ? "is-correct" : "is-wrong");
        feedback.textContent = right ? t("tests.correct") : t("tests.wrong", { answer: sentence.answer });
        onAnswer(right);
        autoSpeak(sentence.answer, dict);
        draw();
        action.focus({ preventScroll: true, focusVisible: false });
    }
    draw();
    return [
        h("div", { class: "question" }, h("span", { class: "flashcard-label" }, languageName(dict.to, getLocale())), h("h2", { class: "question-word sentence-prompt" }, sentence.prompt)),
        line, bank, feedback, h("div", { class: "session-footer" }, action),
    ];
}

// onMatch(word, clean): clean = this word had no mistakes on the board.
export function pairsBoard({ words, dict, onMatch, onMistake, onDone }) {
    const missed = new Set();
    let left = words.length;
    let picked = null; // { word, side, el }
    const unpick = () => {
        picked?.el.classList.remove("is-picked");
        picked?.el.setAttribute("aria-pressed", "false");
        picked = null;
    };
    const choose = (word, side, el) => {
        if (!picked || picked.side === side) {
            const same = picked?.el === el;
            unpick();
            if (same) return;
            picked = { word, side, el };
            el.classList.add("is-picked");
            el.setAttribute("aria-pressed", "true");
            return;
        }
        const first = picked;
        unpick();
        if (first.word === word) {
            play("right");
            for (const node of [first.el, el]) { node.disabled = true; node.classList.add("is-matched"); }
            autoSpeak(word.translation, dict);
            left--;
            onMatch(word, !missed.has(word.id));
            if (!left) setTimeout(onDone, 450);
        } else {
            play("wrong");
            missed.add(first.word.id).add(word.id);
            onMistake?.();
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
    return h("div", { class: "pairs" }, column("word"), column("translation"));
}
