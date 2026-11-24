import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { getActiveDictionary, getDictQueue } from "../core/store.js";
import { icon } from "./icons.js";
import { openDictionaryPicker } from "./dictionary-picker.js";
import { openDictionary } from "./dictionary-modals.js";
import { openStudy } from "./study.js";

// The main card: what to do right now.
export function heroCard() {
    const dict = getActiveDictionary();
    const button = (name, label, onClick) => h("button", { class: "btn hero-btn", type: "button", onClick }, icon(name), label);
    const hero = (emoji, title, text, action) => h("section", { class: "hero" },
        h("div", { class: "hero-top" },
            h("span", { class: "eyebrow" }, t("hero.active")),
            dict && h("button", { class: "hero-change", type: "button", onClick: openDictionaryPicker }, t("hero.change"))),
        h("h2", { class: "hero-title" }, h("span", { "aria-hidden": "true" }, `${emoji} `), title),
        h("p", { class: "hero-text" }, text),
        action);

    if (!dict) return hero("📚", t("hero.none"), t("hero.noneText"), button("dictionaries", t("hero.none"), openDictionaryPicker));
    if (!dict.words.length) return hero(dict.emoji, dict.name, t("hero.empty"), button("plus", t("word.add"), () => openDictionary(dict.id)));

    const { due, soon, fresh } = getDictQueue(dict);
    const reviews = due.length + soon.length;
    return reviews + fresh.length
        ? hero(dict.emoji, dict.name, t("hero.ready", { due: reviews, fresh: fresh.length }), button("play", t("hero.start"), () => openStudy(dict.id)))
        : hero(dict.emoji, dict.name, t("hero.rest"));
}
