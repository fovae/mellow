import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { mascot } from "./mascot.js";
import { icon } from "./icons.js";
import { openLibrary } from "./library-modal.js";
import { quickAdd } from "./actions.js";
import { getDictionaries } from "../core/store.js";

// Shown instead of a screen while the profile has no words.
export function emptyHero() {
    const has = getDictionaries().length > 0;
    return h("section", { class: "hero today-hero" },
        h("div", { class: "today-top" },
            h("div", { class: "today-text" }, h("h2", { class: "hero-title" }, t("hero.hello")), h("p", { class: "hero-text" }, t(has ? "hero.empty" : "hero.noneText"))),
            h("span", { class: "mello-btn" }, mascot("calm"))),
        has
            ? h("button", { class: "btn hero-btn", type: "button", onClick: quickAdd }, icon("plus"), t("word.add"))
            : h("button", { class: "btn hero-btn", type: "button", onClick: openLibrary }, icon("dictionaries"), t("library.title")));
}
