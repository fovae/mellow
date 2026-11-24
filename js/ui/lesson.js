import { art, withDrop } from "./art.js";
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { buildLesson } from "../core/lessons.js";
import { play } from "../core/sound.js";
import { canSpeak, speak } from "../core/speech.js";
import { finishLesson, getDictionary, getState, recordTestAnswer } from "../core/store.js";
import { languageName } from "../data/languages.js";
import { pairsBoard, questionExercise, sentenceExercise } from "./exercises.js";
import { openFullscreen, confirmModal } from "./modal.js";
import { mascot } from "./mascot.js";
import { sessionHeader, speakButton, statTile } from "./parts.js";
import { confetti } from "./toast.js";

const COMBO = 3;

export function openLesson(dictId, wordIds) {
    const dict = getDictionary(dictId);
    const ids = new Set(wordIds);
    const list = dict.words.filter((w) => ids.has(w.id));
    const steps = buildLesson(list, dict.words, { speech: canSpeak() });
    const mistakes = new Map(list.map((w) => [w.id, 0]));
    const screen = openFullscreen(t("path.lesson"), null, () => confirmExit());
    let index = 0;
    let combo = 0;
    let finished = false;

    // Leaving in the middle does not save the lesson, so ask first.
    function confirmExit() {
        if (finished || index === 0) return screen.close();
        confirmModal({ title: t("path.exitTitle"), text: t("path.exitText"), action: t("path.exit"), onConfirm: screen.close });
    }

    const header = () => sessionHeader(confirmExit, index / steps.length, combo >= COMBO ? [art("✦", "art-inline"), ` ${combo}`] : "");
    const answer = (wordId, correct) => {
        combo = correct ? combo + 1 : 0;
        if (!correct) mistakes.set(wordId, mistakes.get(wordId) + 1);
        recordTestAnswer(dictId, wordId, correct);
    };
    const next = () => { index++; draw(); };

    function drawIntro({ wordId }) {
        const word = list.find((w) => w.id === wordId);
        if (getState().settings.autoSpeak) speak(word.translation, dict.to);
        const go = h("button", { class: "btn btn-primary", type: "button", onClick: next }, t("path.gotIt"));
        screen.draw(header(),
            h("div", { class: "intro" },
                h("span", { class: "badge" }, t("path.newWord")),
                h("span", { class: "flashcard-label" }, languageName(dict.to, getLocale())),
                h("h2", { class: "question-word" }, word.translation),
                speakButton(word.translation, dict.to),
                h("p", { class: "intro-meaning" }, word.word),
                word.example && h("p", { class: "example" }, word.example)),
            h("div", { class: "session-footer" }, go));
        go.focus({ preventScroll: true, focusVisible: false });
    }

    function draw() {
        const step = steps[index];
        if (!step) return drawEnd();
        if (step.type === "intro") return drawIntro(step);
        if (step.type === "pairs") {
            return screen.draw(header(), h("p", { class: "muted session-hint" }, t("games.pairsHint")), pairsBoard({
                words: step.words, dict,
                onMatch: (word, clean) => answer(word.id, clean),
                onDone: () => screen.isOpen() && next(),
            }));
        }
        // A missed exercise comes back at the end of the lesson.
        const onAnswer = (correct) => {
            answer(step.wordId, correct);
            if (!correct) steps.push(step);
        };
        screen.draw(header(), ...(step.type === "sentence"
            ? sentenceExercise({ sentence: step.sentence, dict, onAnswer, onNext: next })
            : questionExercise({ question: step.question, mode: step.mode, reverse: step.reverse, dict, onAnswer, onNext: next })));
    }

    function drawEnd() {
        finished = true;
        const total = [...mistakes.values()].reduce((sum, count) => sum + count, 0);
        const { xp, drops } = finishLesson(dictId, [...mistakes].map(([id, count]) => ({ id, mistakes: count })));
        screen.draw(sessionHeader(screen.close, 1, ""),
            h("div", { class: "session-summary" },
                mascot("happy", "mascot-large"),
                h("h2", { class: "screen-title" }, t(total ? "path.done" : "path.perfect")),
                h("p", { class: "muted" }, t("study.doneText")),
                h("div", { class: "stats-grid stats-grid-3" },
                    statTile(`+${xp}`, t("xp.title")), statTile(withDrop(`+${drops}`), t("drops.title")), statTile(total, t("games.mistakes")))),
            h("div", { class: "session-footer" }, h("button", { class: "btn btn-primary", type: "button", onClick: screen.close }, t("common.done"))));
        play("done");
        confetti(screen.body);
    }

    draw();
}
