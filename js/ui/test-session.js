import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { buildQuiz, isCorrect } from "../core/quiz.js";
import { getDictionary, recordTestAnswer } from "../core/store.js";
import { openFullscreen } from "./modal.js";
import { icon } from "./icons.js";
import { languageName } from "../data/languages.js";

export function openTest(dictId, options) {
    const dict = getDictionary(dictId);
    const questions = buildQuiz(dict.words, options);
    const mistakes = [];
    let index = 0;
    const screen = openFullscreen(t("tests.title"));
    const targetLanguage = languageName(options.reverse ? dict.from : dict.to, getLocale());

    const header = () => h("header", { class: "session-header" },
        h("button", { class: "icon-btn", type: "button", "aria-label": t("common.close"), onClick: screen.close }, icon("close")),
        h("div", { class: "bar" }, h("div", { class: "bar-fill", style: { width: `${(index / questions.length) * 100}%` } })),
        h("span", { class: "muted session-count" }, `${Math.min(index + 1, questions.length)} / ${questions.length}`));

    function drawQuestion() {
        const question = questions[index];
        const feedback = h("p", { class: "feedback", role: "status" });
        const footer = h("div", { class: "session-footer" });
        let answered = false;

        const finish = (text) => {
            if (answered) return false;
            answered = true;
            const correct = isCorrect(question, text);
            if (!correct) mistakes.push(question);
            recordTestAnswer(dictId, question.wordId, correct);
            feedback.textContent = correct ? t("tests.correct") : t("tests.wrong", { answer: question.answer });
            feedback.classList.add(correct ? "is-correct" : "is-wrong");
            const next = h("button", { class: "btn btn-primary", type: "button", onClick: () => { index++; draw(); } }, t("tests.next"));
            footer.replaceChildren(next);
            // After Enter in the form: do not let the same key press activate the button.
            setTimeout(() => next.focus({ preventScroll: true }), 0);
            return true;
        };

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
            h("div", { class: "question" }, h("span", { class: "flashcard-label" }, targetLanguage), h("h2", { class: "question-word" }, question.prompt)),
            body, feedback, footer);
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
                h("button", { class: "btn btn-soft", type: "button", onClick: () => { screen.close(); openTest(dictId, options); } }, t("tests.again")),
                h("button", { class: "btn btn-primary", type: "button", onClick: screen.close }, t("common.done"))));
    }

    const draw = () => (index < questions.length ? drawQuestion() : drawResult());
    draw();
}
