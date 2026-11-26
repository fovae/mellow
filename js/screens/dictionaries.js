// "Topics": what is learned in the current course. Library topics come from the catalog;
// the person's own words live in one topic, "My words". The course itself is changed in the profile.
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { getCurrentTopic, getDictionaries, getMyWords, getProfile, getProgress } from "../core/store.js";
import { languageName } from "../data/languages.js";
import { screenHeader } from "../ui/navigation.js";
import { cell, group } from "../ui/cells.js";
import { statusBar, topicName } from "../ui/parts.js";
import { openLibrary } from "../ui/library-modal.js";
import { openDictionary, openMyWords } from "../ui/dictionary-modals.js";

export function renderDictionaries() {
    const dictionaries = getDictionaries();
    const current = getCurrentTopic();
    const { from, to } = getProfile();

    const row = (dict) => cell({
        emoji: dict.emoji, label: topicName(dict), className: "dict-card", attrs: { "aria-haspopup": "dialog" }, onClick: () => openDictionary(dict.id),
        sub: h("span", { class: "dict-info" },
            h("small", { class: "cell-sub" }, t("words.count", { count: dict.words.length })),
            dict.words.length > 0 && h("span", { class: "cell-progress" }, statusBar(dict.words), h("small", {}, `${getProgress(dict)}%`))),
    });
    const isDone = (d) => d.words.length > 0 && d.words.every((w) => w.srs);
    const others = dictionaries.filter((d) => d !== current && !d.mine);
    const next = others.filter((d) => !isDone(d));
    const done = others.filter(isDone);
    const mine = getMyWords();

    return [
        screenHeader(t("dict.course", { to: languageName(to, getLocale()), from: languageName(from, getLocale()) }), t("dict.title")),
        h("button", { class: "hero hero-link", type: "button", onClick: openLibrary },
            h("span", { class: "eyebrow" }, t("library.eyebrow")),
            h("strong", { class: "hero-title" }, t("library.title")),
            h("span", { class: "hero-text" }, t("library.text"))),
        current && !current.mine && group(t("hero.active"), [row(current)]),
        group(t("dict.mineGroup"), [mine
            ? row(mine)
            : cell({ emoji: "✏️", label: t("dict.mine"), sub: t("dict.mineText"), attrs: { "aria-haspopup": "dialog" }, onClick: openMyWords })]),
        next.length > 0 && group(t("course.later"), next.map(row)),
        done.length > 0 && group(t("course.done"), done.map(row)),
    ].filter(Boolean);
}
