import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import * as store from "../core/store.js";
import { normalize } from "../core/quiz.js";
import { LIBRARY_LANGUAGES, loadLibrary, libraryKey, topicWords, toDictionary } from "../core/library.js";
import { languageName } from "../data/languages.js";
import { openModal } from "./modal.js";
import { icon } from "./icons.js";
import { speakButton } from "./parts.js";
import { openDictionary } from "./dictionary-modals.js";

export const languageSelect = (value, onChange) => h("select", { class: "input", onChange },
    LIBRARY_LANGUAGES.map((name) => h("option", { value: name, selected: name === value }, languageName(name, getLocale()))));

export const topicTitle = (topic) => topic.title[getLocale()] ?? topic.title.en;

// Adds topics for the pair; the first one becomes active when nothing is active.
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
        title: `${topic.emoji} ${topicTitle(topic)}`,
        className: "modal-page",
        build: () => [h("div", { class: "card word-list" }, words.map((w) => h("div", { class: "row" },
            h("span", { class: "row-main" }, h("strong", {}, w.word), h("small", { class: "muted" }, w.translation),
                w.example && h("small", { class: "example" }, w.example)),
            speakButton(w.translation, to)))), footer],
    });
    footer.closest("dialog").addEventListener("close", unsubscribe);
}

export async function openLibrary() {
    const { settings } = store.getState();
    const active = store.getActiveDictionary();
    const usable = (name) => LIBRARY_LANGUAGES.includes(name);
    let { native: from, target: to } = active && usable(active.from) && usable(active.to) && active.from !== active.to
        ? { native: active.from, target: active.to } : settings;
    let topics = null;
    let failed = false;

    const body = h("div", { class: "stack" });
    const search = h("input", { class: "input", type: "search", placeholder: t("library.search"), "aria-label": t("library.search"), onInput: () => draw() });
    const fromSelect = languageSelect(from, () => change(fromSelect.value, to));
    const toSelect = languageSelect(to, () => change(from, toSelect.value));

    // Choosing the same language twice swaps the pair.
    function change(nextFrom, nextTo) {
        if (nextFrom === nextTo) [nextFrom, nextTo] = nextFrom === from ? [to, from] : [to, from];
        [from, to] = [nextFrom, nextTo];
        fromSelect.value = from;
        toSelect.value = to;
        store.updateSettings({ native: from, target: to });
        draw();
    }

    function draw() {
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
            h("div", { class: "topic-grid" }, shown.map((topic) => h("div", { class: "card topic" },
                h("button", { class: "topic-main", type: "button", onClick: () => openTopic(topic, from, to) },
                    h("span", { class: "dict-emoji" }, topic.emoji),
                    h("strong", {}, topicTitle(topic)),
                    h("small", { class: "muted" }, `${topic.level} · ${t("words.count", { count: topic.rows.length })}`)),
                isAdded(topic)
                    ? h("span", { class: "badge" }, t("library.added"))
                    : h("button", { class: "icon-btn icon-btn-soft", type: "button", "aria-label": `${t("common.add")}: ${topicTitle(topic)}`, onClick: () => addTopics([topic], from, to) }, icon("plus"))))),
            !query && left.length > 1 && h("button", { class: "btn btn-soft btn-wide", type: "button", onClick: () => addTopics(left, from, to) }, icon("plus"), t("library.addAll")),
        ].filter(Boolean));
    }

    draw();
    const unsubscribe = store.subscribe((type) => type !== "time" && draw());
    openModal({
        title: t("library.title"),
        className: "modal-page",
        build: () => h("div", { class: "stack" },
            h("div", { class: "field-pair" },
                h("label", { class: "field" }, h("span", { class: "field-label" }, t("library.native")), fromSelect),
                h("label", { class: "field" }, h("span", { class: "field-label" }, t("library.target")), toSelect)),
            search, body),
    });
    body.closest("dialog").addEventListener("close", unsubscribe);
    topics = await loadLibrary();
    failed = !topics;
    draw();
}
