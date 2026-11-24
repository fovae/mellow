import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { buildQuiz, hintMask, isCorrect } from "../core/quiz.js";
import { getDictionary, recordTestAnswer } from "../core/store.js";
import { speak } from "../core/speech.js";
import { openFullscreen } from "./modal.js";
import { icon } from "./icons.js";
import { languageName } from "../data/languages.js";

// sources: [{ dictId, only? }], where `only` is a set of word ids.
// Listening asks by sound: the learner hears the studied language and picks the meaning.
export function openTest(sources, options) {
    const listen = options.mode === "listen";
    const reverse = listen || options.reverse;
    const build = () => sources
        .flatMap(({ dictId, only }) => buildQuiz(getDictionary(dictId).words, { ...options, reverse, only }).map((q) => ({ ...q, dict: getDictionary(dictId) })))
        .filter((q) => options.mode === "typing" || q.options.length > 1)
        .slice(0, options.count);
    let questions = build();
    // Too few words to choose from: ask to type instead.
    if (!questions.length && options.mode === "choice") {
        options = { ...options, mode: "typing" };
        questions = build();
    }
    const mistakes = [];
    let index = 0;
    const screen = openFullscreen(t("tests.title"));

    const header = () => h("header", { class: "session-header" },
        h("button", { class: "icon-btn", type: "button", "aria-label": t("common.close"), onClick: screen.close }, icon("close")),
        h("div", { class: "bar" }, h("div", { class: "bar-fill", style: { width: `${(index / questions.length) * 100}%` } })),
        h("span", { class: "muted session-count" }, `${Math.min(index + 1, questions.length)} / ${questions.length}`));

    function drawQuestion() {
        const question = questions[index];
        const { dict } = question;
        const answerLanguage = languageName(reverse ? dict.from : dict.to, getLocale());
        const play = () => speak(question.prompt, dict.to);
        const word = h("h2", { class: "question-word", hidden: listen }, question.prompt);
        const feedback = h("p", { class: "feedback", role: "status" });
        const footer = h("div", { class: "session-footer" });
        let answered = false;

        const finish = (text) => {
            if (answered) return false;
            answered = true;
            const correct = isCorrect(question, text);
            if (!correct) mistakes.push(question);
            recordTestAnswer(dict.id, question.wordId, correct);
            word.hidden = false;
            help.hidden = true;
            feedback.textContent = correct ? t("tests.correct") : t("tests.wrong", { answer: question.answer });
            feedback.classList.add(correct ? "is-correct" : "is-wrong");
            const next = h("button", { class: "btn btn-primary", type: "button", onClick: () => { index++; draw(); } }, t("tests.next"));
            footer.replaceChildren(next);
            // After Enter in the form: do not let the same key press activate the button.
            setTimeout(() => next.focus({ preventScroll: true }), 0);
            return true;
        };

        let letters = 0;
        const help = h("button", {
            class: "hint-btn", type: "button",
            onClick: () => {
                if (options.mode === "typing") return void (feedback.textContent = hintMask(question.answer, ++letters));
                // Leave the right answer and one wrong one.
                const wrong = [...body.children].filter((el) => !isCorrect(question, el.textContent));
                wrong.slice(1).forEach((el) => { el.disabled = true; el.classList.add("is-removed"); });
                help.hidden = true;
            },
        }, icon("bulb"), t("study.help"));
        if (options.mode !== "typing" && question.options.length < 3) help.hidden = true;

        let body;
        if (options.mode === "typing") {
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
        screen.draw(header(),
            h("div", { class: "question" }, h("span", { class: "flashcard-label" }, answerLanguage),
                listen && h("button", { class: "listen-btn", type: "button", "aria-label": t("common.listen"), onClick: play }, icon("sound")), word),
            body, feedback, help, footer);
        if (listen) play();
    }

    function drawResult() {
        const correct = questions.length - mistakes.length;
        screen.draw(header(),
            h("div", { class: "session-summary" },
                h("div", { class: "summary-emoji" }, mistakes.length ? "💪" : "🏆"),
                h("h2", { class: "screen-title" }, t("tests.resultTitle", { correct, total: questions.length })),
                mistakes.length
                    ? h("div", { class: "card summary-list" }, h("h3", { class: "section-title" }, t("tests.mistakes")),
                        mistakes.map((q) => h("div", { class: "row" }, h("span", { class: "row-main" }, h("strong", {}, q.prompt), h("small", { class: "muted" }, q.answer)))))
                    : h("p", { class: "muted" }, t("tests.perfect"))),
            h("div", { class: "session-footer" },
                h("button", { class: "btn btn-soft", type: "button", onClick: () => { screen.close(); openTest(sources, options); } }, t("tests.again")),
                h("button", { class: "btn btn-primary", type: "button", onClick: screen.close }, t("common.done"))));
    }

    const draw = () => (index < questions.length ? drawQuestion() : drawResult());
    draw();
}
