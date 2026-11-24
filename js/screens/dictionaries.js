import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { getState, getProgress, setActiveDictionary } from "../core/store.js";
import { screenHeader } from "../ui/navigation.js";
import { icon } from "../ui/icons.js";
import { openDictionary, openDictionaryForm, confirmRemoveDictionary } from "../ui/dictionary-modals.js";
import { progressBar } from "./home.js";

export function renderDictionaries() {
    const { dictionaries, activeDictionaryId } = getState();

    const card = (dict) => {
        const isActive = dict.id === activeDictionaryId;
        return h("article", { class: `card dict-card ${isActive ? "is-active" : ""}` },
            h("div", { class: "dict-top" },
                h("span", { class: "dict-emoji" }, dict.emoji),
                isActive && h("span", { class: "badge" }, t("dict.active")),
                h("span", { class: "muted dict-count" }, t("words.count", { count: dict.words.length }))),
            h("h2", { class: "section-title" }, dict.name),
            dict.description && h("p", { class: "muted" }, dict.description),
            progressBar(getProgress(dict)),
            h("div", { class: "actions" },
                !isActive && h("button", { class: "btn btn-primary", type: "button", onClick: () => setActiveDictionary(dict.id) }, t("dict.select")),
                h("button", { class: "btn btn-soft", type: "button", onClick: () => openDictionary(dict.id) }, t("dict.open")),
                h("button", { class: "icon-btn is-danger", type: "button", "aria-label": t("common.delete"), onClick: () => confirmRemoveDictionary(dict) }, icon("trash"))));
    };

    return [
        screenHeader(t("dict.title"), t("dict.subtitle"),
            h("button", { class: "btn btn-primary btn-pill", type: "button", onClick: () => openDictionaryForm() }, t("dict.new"))),
        ...(dictionaries.length ? dictionaries.map(card) : [h("p", { class: "card muted" }, t("dict.empty"))]),
    ];
}
