import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { buildQuiz } from "../core/quiz.js";
import { play } from "../core/sound.js";
import { getDictionary, recordTestAnswer } from "../core/store.js";
import { questionExercise } from "./exercises.js";
import { openFullscreen } from "./modal.js";
import { mascot } from "./mascot.js";
import { sessionHeader } from "./parts.js";
import { confetti } from "./toast.js";

// sources: [{ dictId, only? }], where `only` is a set of word ids.
export function openTest(sources, options) {
    const isReverse = () => options.mode === "listen" || options.reverse;
    const build = () => sources
        .flatMap(({ dictId, only }) => buildQuiz(getDictionary(dictId).words, { ...options, reverse: isReverse(), only }).map((q) => ({ ...q, dict: getDictionary(dictId) })))
        .filter((q) => options.mode === "typing" || q.options.length > 1)
        .sort(() => (sources.length > 1 ? Math.random() - 0.5 : 0))
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
    const header = () => sessionHeader(screen.close, index / questions.length, `${Math.min(index + 1, questions.length)} / ${questions.length}`);

    function drawQuestion() {
        const question = questions[index];
        screen.draw(header(), ...questionExercise({
            question, mode: options.mode, reverse: isReverse(), dict: question.dict,
            onAnswer: (correct) => {
                if (!correct) mistakes.push(question);
                recordTestAnswer(question.dict.id, question.wordId, correct);
            },
            onNext: () => { index++; draw(); },
        }));
    }

    function drawResult() {
        const correct = questions.length - mistakes.length;
        screen.draw(header(),
            h("div", { class: "session-summary" },
                mascot(mistakes.length > correct ? "calm" : "happy", "mascot-large"),
                h("h2", { class: "screen-title" }, t("tests.resultTitle", { correct, total: questions.length })),
                mistakes.length
                    ? h("div", { class: "card summary-list" }, h("h3", { class: "section-title" }, t("tests.mistakes")),
                        mistakes.map((q) => h("div", { class: "row" }, h("span", { class: "row-main" }, h("strong", {}, q.prompt), h("small", { class: "muted" }, q.answer)))))
                    : h("p", { class: "muted" }, t("tests.perfect"))),
            h("div", { class: "session-footer" },
                h("button", { class: "btn btn-soft", type: "button", onClick: () => { screen.close(); openTest(sources, options); } }, t("tests.again")),
                h("button", { class: "btn btn-primary", type: "button", onClick: screen.close }, t("common.done"))));
        play("done");
        if (!mistakes.length) confetti(screen.body);
    }

    const draw = () => (index < questions.length ? drawQuestion() : drawResult());
    draw();
}
