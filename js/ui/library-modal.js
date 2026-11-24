import { art } from "./art.js";
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import * as store from "../core/store.js";
import { normalize } from "../core/quiz.js";
import { LIBRARY_LANGUAGES, loadLibrary, libraryKey, topicWords, toDictionary } from "../core/library.js";
import { languageFlag, languageName } from "../data/languages.js";
import { openModal } from "./modal.js";
import { group } from "./cells.js";
import { dropdown } from "./dropdown.js";
import { icon } from "./icons.js";
import { speakButton } from "./parts.js";
import { openDictionary } from "./dictionary-modals.js";

export const languageSelect = (label, value, onChange) => dropdown({
    label, value, onChange,
    options: LIBRARY_LANGUAGES.map((name) => ({ value: name, name: languageName(name, getLocale()), emoji: languageFlag(name) })),
});

export const topicTitle = (topic) => topic.title[getLocale()] ?? topic.title.en;

// Adds topics for the pair to the end of the course.
export function addTopics(topics, from, to) {
    const added = store.getLibraryKeys();
    return store.addDictionaries(topics.filter((topic) => !added.has(libraryKey(topic.id, from, to))).map((topic) => toDictionary(topic, from, to, getLocale())));
}

function openTopic(topic, from, to) {
    const words = topicWords(topic, from, to);
    const footer = h("div", { class: "actions sheet-footer" });
    const draw = () => {
        const dict = store.getState().dictionaries.find((d) => d.libraryKey === libraryKey(topic.id, from, to));
        footer.replaceChildren(dict
            ? h("button", { class: "btn btn-soft", type: "button", onClick: () => openDictionary(dict.id) }, icon("check"), t("library.open"))
            : h("button", { class: "btn btn-primary", type: "button", onClick: () => addTopics([topic], from, to) }, icon("plus"), t("library.add", { count: words.length })));
    };
    draw();
    const unsubscribe = store.subscribe(draw);
    openModal({
        title: topicTitle(topic),
        emoji: topic.emoji,
        className: "modal-page",
        build: () => [h("div", { class: "card word-list" }, words.map((w) => h("div", { class: "row" },
            h("span", { class: "row-main" }, h("strong", {}, w.word), h("small", { class: "muted" }, w.translation),
                w.example && h("small", { class: "example" }, w.example)),
            speakButton(w.translation, to)))), footer],
    });
    footer.closest("dialog").addEventListener("close", unsubscribe);
}

export async function openLibrary() {
    const { from, to } = store.getProfile();
    const supported = LIBRARY_LANGUAGES.includes(from) && LIBRARY_LANGUAGES.includes(to);
    let topics = null;
    let failed = false;

    const body = h("div", { class: "stack" });
    const search = h("input", { class: "input", type: "search", placeholder: t("library.search"), "aria-label": t("library.search"), onInput: () => draw() });
    function draw() {
        if (!supported) return body.replaceChildren(h("p", { class: "muted" }, t("library.unsupported")));
        if (!topics) return body.replaceChildren(h("p", { class: "muted" }, failed ? t("library.failed") : t("library.loading")));
        const query = normalize(search.value);
        const added = store.getLibraryKeys();
        const isAdded = (topic) => added.has(libraryKey(topic.id, from, to));
        const matches = (topic) => !query || normalize(topicTitle(topic)).includes(query) ||
            topicWords(topic, from, to).some((w) => normalize(w.word).includes(query) || normalize(w.translation).includes(query));
        const shown = topics.filter(matches);
        const left = topics.filter((topic) => !isAdded(topic));
        const total = topics.reduce((sum, topic) => sum + topic.rows.length, 0);

        body.replaceChildren(...[
            h("p", { class: "muted" }, t("library.total", { topics: topics.length, words: total, added: topics.length - left.length })),
            !shown.length && h("p", { class: "muted" }, t("dict.notFound")),
            ...[...new Set(shown.map((topic) => topic.level))].sort().map((level) => group(level, shown.filter((topic) => topic.level === level).map((topic) => h("div", { class: "cell topic" },
                h("button", { class: "topic-main", type: "button", onClick: () => openTopic(topic, from, to) },
                    h("span", { class: "cell-emoji", "aria-hidden": "true" }, art(topic.emoji)),
                    h("span", { class: "cell-text" }, h("span", { class: "cell-label" }, topicTitle(topic)),
                        h("small", { class: "cell-sub" }, t("words.count", { count: topic.rows.length })))),
                isAdded(topic)
                    ? h("span", { class: "topic-added", role: "img", "aria-label": t("library.added") }, icon("check"))
                    : h("button", { class: "icon-btn icon-btn-soft", type: "button", "aria-label": `${t("common.add")}: ${topicTitle(topic)}`, onClick: () => addTopics([topic], from, to) }, icon("plus")))))),
            !query && left.length > 1 && h("button", { class: "btn btn-soft btn-wide", type: "button", onClick: () => addTopics(left, from, to) }, icon("plus"), t("library.addAll")),
        ].filter(Boolean));
    }

    draw();
    const unsubscribe = store.subscribe((type) => type !== "time" && draw());
    openModal({
        title: t("library.title"),
        className: "modal-page",
        build: () => h("div", { class: "stack" },
            h("p", { class: "muted" }, art(languageFlag(to)), ` ${languageName(from, getLocale())} → ${languageName(to, getLocale())}`),
            supported && search, body),
    });
    body.closest("dialog").addEventListener("close", unsubscribe);
    topics = await loadLibrary();
    failed = !topics;
    draw();
}
