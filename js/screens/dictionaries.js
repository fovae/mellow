import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { getCurrentTopic, getDictionaries, getProgress } from "../core/store.js";
import { screenHeader } from "../ui/navigation.js";
import { cell, group } from "../ui/cells.js";
import { mascot } from "../ui/mascot.js";
import { icon } from "../ui/icons.js";
import { openModal } from "../ui/modal.js";
import { statusBar } from "../ui/parts.js";
import { openLibrary } from "../ui/library-modal.js";
import { openDictionary, openDictionaryForm } from "../ui/dictionary-modals.js";

const savedWords = () => getDictionaries().flatMap((dict) => dict.words.filter((w) => w.isFavourite).map((word) => ({ word, dict })));

const openSaved = () => openModal({
    title: t("home.saved"),
    build: () => group(null, savedWords().map(({ word, dict }) => cell({ emoji: dict.emoji, label: word.word, sub: word.translation }))),
});

export function renderDictionaries() {
    const dictionaries = getDictionaries();
    const current = getCurrentTopic();
    const saved = savedWords().length;

    const row = (dict) => cell({
        emoji: dict.emoji, label: dict.name, className: "dict-card", onClick: () => openDictionary(dict.id),
        sub: h("span", { class: "dict-info" },
            h("small", { class: "cell-sub" }, t("words.count", { count: dict.words.length })),
            h("span", { class: "cell-progress" }, statusBar(dict.words), h("small", {}, `${getProgress(dict)}%`))),
    });
    const isDone = (d) => d.words.length > 0 && d.words.every((w) => w.srs);
    const others = dictionaries.filter((d) => d !== current);
    const next = others.filter((d) => !isDone(d));
    const done = others.filter(isDone);

    return [
        screenHeader(t("dict.eyebrow"), t("dict.title"),
            h("button", { class: "icon-btn icon-btn-fill", type: "button", "aria-label": t("dict.new"), onClick: () => openDictionaryForm() }, icon("plus"))),
        h("button", { class: "hero hero-link", type: "button", onClick: openLibrary },
            h("span", { class: "eyebrow" }, t("library.eyebrow")),
            h("strong", { class: "hero-title" }, t("library.title")),
            h("span", { class: "hero-text" }, t("library.text"))),
        !dictionaries.length && h("div", { class: "card empty" }, mascot("sleepy"), h("p", { class: "muted" }, t("dict.empty"))),
        current && group(t("hero.active"), [row(current)]),
        next.length > 0 && group(t("course.later"), next.map(row)),
        done.length > 0 && group(t("course.done"), done.map(row)),
        group(null, [cell({ icon: "bookmark", tint: 3, label: t("home.saved"), value: String(saved), disabled: !saved, onClick: openSaved })],
            { foot: saved ? "" : t("home.savedEmpty") }),
    ].filter(Boolean);
}
