import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { normalize } from "../core/quiz.js";
import { getActiveDictionary } from "../core/store.js";
import { languageName } from "../data/languages.js";
import { screenHeader, refresh } from "../ui/navigation.js";
import { heroCard } from "../ui/hero.js";
import { icon } from "../ui/icons.js";
import { section, segmented } from "../ui/parts.js";
import { openDictionaryPicker } from "../ui/dictionary-picker.js";
import { canSpeak } from "../core/speech.js";
import { openTest } from "../ui/test-session.js";

const options = { mode: "choice", reverse: false, count: 10 };
const set = (key) => (value) => { options[key] = value; refresh(); };

export function renderTests() {
    const header = screenHeader(t("tests.eyebrow"), t("tests.title"));
    const dict = getActiveDictionary();
    if (!dict) return [header, heroCard()];

    const distinct = (key) => new Set(dict.words.map((w) => normalize(w[key]))).size;
    const ready = distinct("word") >= 2 && distinct("translation") >= 2;
    const direction = [dict.from, dict.to].map((lang) => languageName(lang, getLocale()));
    const group = (label, values, key) => h("div", { class: "field" }, h("span", { class: "field-label" }, label), segmented(label, values, options[key], set(key)));

    return [
        header,
        h("button", { class: "card dict-card", type: "button", onClick: openDictionaryPicker },
            h("span", { class: "dict-top" }, h("span", { class: "dict-emoji" }, dict.emoji),
                h("span", { class: "row-main" }, h("strong", {}, dict.name), h("small", { class: "muted" }, t("words.count", { count: dict.words.length }))),
                h("span", { class: "link" }, t("hero.change")))),
        section(null, h("div", { class: "form" },
            group(t("tests.mode"), [{ value: "choice", label: t("tests.choice") }, { value: "typing", label: t("tests.typing") }, ...(canSpeak() ? [{ value: "listen", label: t("tests.listen") }] : [])], "mode"),
            options.mode !== "listen" && group(t("tests.direction"), [{ value: false, label: `→ ${direction[1]}` }, { value: true, label: `→ ${direction[0]}` }], "reverse"),
            group(t("tests.length"), [5, 10, 20].map((value) => ({ value, label: String(value) })), "count"),
            ready
                ? h("button", { class: "btn btn-primary", type: "button", onClick: () => openTest([{ dictId: dict.id }], { ...options }) }, icon("play"), t("tests.start"))
                : h("p", { class: "muted" }, t("tests.few")))),
    ];
}
