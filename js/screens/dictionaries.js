import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { getState, getProgress } from "../core/store.js";
import { languageName } from "../data/languages.js";
import { screenHeader } from "../ui/navigation.js";
import { mascot } from "../ui/mascot.js";
import { icon } from "../ui/icons.js";
import { section, statusBar } from "../ui/parts.js";
import { openLibrary } from "../ui/library-modal.js";
import { openDictionary, openDictionaryForm } from "../ui/dictionary-modals.js";

export function renderDictionaries() {
    const { dictionaries, activeDictionaryId } = getState();

    const card = (dict) => h("button", { class: "card dict-card", type: "button", onClick: () => openDictionary(dict.id) },
        h("span", { class: "dict-top" },
            h("span", { class: "dict-emoji" }, dict.emoji),
            h("span", { class: "row-main" }, h("strong", {}, dict.name),
                h("small", { class: "muted" }, `${languageName(dict.from, getLocale())} → ${languageName(dict.to, getLocale())} · ${t("words.count", { count: dict.words.length })}`)),
            dict.id === activeDictionaryId ? h("span", { class: "badge" }, t("dict.active")) : icon("chevron")),
        h("span", { class: "dict-progress" }, statusBar(dict.words), h("strong", {}, `${getProgress(dict)}%`)));

    return [
        screenHeader(t("dict.eyebrow"), t("dict.title"),
            h("button", { class: "icon-btn icon-btn-fill", type: "button", "aria-label": t("dict.new"), onClick: () => openDictionaryForm() }, icon("plus"))),
        h("button", { class: "hero hero-link", type: "button", onClick: openLibrary },
            h("span", { class: "eyebrow" }, t("library.eyebrow")),
            h("strong", { class: "hero-title" }, t("library.title")),
            h("span", { class: "hero-text" }, t("library.text"))),
        ...(dictionaries.length ? [...dictionaries].sort((a, b) => (b.id === activeDictionaryId) - (a.id === activeDictionaryId)).map(card) : [h("div", { class: "card empty" }, mascot("sleepy"), h("p", { class: "muted" }, t("dict.empty")))]),
    ];
}
