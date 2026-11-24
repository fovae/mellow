import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { getState, setActiveDictionary } from "../core/store.js";
import { openModal } from "./modal.js";

export function openDictionaryPicker() {
    const { dictionaries, activeDictionaryId } = getState();
    openModal({
        title: t("hero.none"),
        build: (close) => dictionaries.length
            ? dictionaries.map((dict) => h("button", {
                class: `row row-btn ${dict.id === activeDictionaryId ? "is-active" : ""}`, type: "button",
                onClick: () => { close(); setActiveDictionary(dict.id); },
            }, h("span", { class: "row-emoji" }, dict.emoji),
                h("span", { class: "row-main" }, h("strong", {}, dict.name), h("small", { class: "muted" }, t("words.count", { count: dict.words.length })))))
            : [h("p", { class: "muted" }, t("dict.empty"))],
    });
}
