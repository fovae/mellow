import { art } from "../ui/art.js";
import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { startOfDay } from "../core/dates.js";
import { allWords, getCurrentTopic, getDictionaries, getDifficult, getProgress } from "../core/store.js";
import { screenHeader } from "../ui/navigation.js";
import { trainDifficult, studyAll, countAll } from "../ui/actions.js";
import { cell, group } from "../ui/cells.js";
import { pathSection } from "../ui/path.js";
import { emptyHero } from "../ui/hero.js";
import { openMessage } from "../ui/transfer-modals.js";
import { openModal } from "../ui/modal.js";
import { statusBar, topicName } from "../ui/parts.js";

function openDifficult() {
    const list = getDifficult();
    openModal({
        title: t("cards.difficult"),
        build: (close) => h("div", { class: "stack" },
            group(null, list.slice(0, 20).map((w) => cell({ label: w.word, sub: w.translation })), { foot: t("cards.difficultText") }),
            h("button", { class: "btn btn-primary btn-wide", type: "button", onClick: () => { close(); trainDifficult(); } }, t("home.difficult"))),
    });
}

// The lessons of any other topic open in a sheet.
const openTopicPath = (dict) => openModal({ title: topicName(dict), emoji: dict.emoji, className: "modal-page", build: () => pathSection(dict) });

const topicRow = (dict) => cell({
    emoji: dict.emoji, label: topicName(dict), attrs: { "aria-haspopup": "dialog" }, onClick: () => openTopicPath(dict),
    sub: h("span", { class: "cell-progress" }, statusBar(dict.words), h("small", {}, `${getProgress(dict)}%`)),
});

export function renderCards() {
    const current = getCurrentTopic();
    const header = screenHeader(t("cards.eyebrow"), t("cards.title"));
    if (!current?.words.length) return [header, emptyHero()];

    const others = getDictionaries().filter((d) => d !== current && d.words.length);
    const isDone = (d) => d.words.every((w) => w.srs);
    const next = others.filter((d) => !isDone(d));
    const done = others.filter(isDone);
    const now = Date.now();
    const between = (from, to) => allWords().filter((w) => w.srs && w.srs.due >= startOfDay(now, from) && w.srs.due < startOfDay(now, to)).length;
    const difficult = getDifficult().length;
    const ready = countAll();
    return [
        header,
        h("section", { class: "unit" },
            h("div", { class: "unit-head" }, h("span", { class: "unit-emoji", "aria-hidden": "true" }, art(current.emoji)),
                h("div", { class: "row-main" }, h("small", {}, t("hero.active")), h("h2", {}, current.name)), h("strong", {}, `${getProgress(current)}%`)),
            pathSection(current)),
        next.length > 0 && group(t("course.later"), next.map(topicRow)),
        done.length > 0 && group(t("course.done"), done.map(topicRow)),
        group(t("cards.review"), [
            cell({ icon: "layers", tint: 1, label: t("home.reviewAll"), value: String(ready), disabled: !ready, onClick: studyAll }),
            cell({ icon: "star", tint: 2, label: t("cards.difficult"), value: String(difficult), disabled: !difficult, onClick: openDifficult }),
            cell({ icon: "calendar", tint: 3, label: t("cards.tomorrow"), value: String(between(1, 2)) }),
            cell({ icon: "calendar", tint: 4, label: t("cards.inWeek"), value: String(between(1, 8)) }),
            cell({ icon: "info", tint: 5, label: t("cards.how"), attrs: { "aria-haspopup": "dialog" }, onClick: () => openMessage(t("cards.how"), t("cards.howText")) }),
        ]),
    ].filter(Boolean);
}
