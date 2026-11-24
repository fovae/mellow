import { h } from "../core/dom.js";
import { t, formatTime, getLocale } from "../core/i18n.js";
import { getState, getActiveDictionary, getTotals, getProgress, countLearned } from "../core/store.js";
import { screenHeader } from "../ui/navigation.js";
import { openDictionaryPicker } from "../ui/dictionary-picker.js";
import { openDictionary } from "../ui/dictionary-modals.js";

const stat = (emoji, value, label) => h("div", { class: "stat" },
    h("span", { class: "stat-icon" }, emoji), h("span", { class: "stat-value" }, value), h("span", { class: "muted" }, label));

export const progressBar = (percent) => h("div", { class: "bar" }, h("div", { class: "bar-fill", style: { width: `${percent}%` } }));

export function renderHome() {
    const { username, dictionaries } = getState();
    const totals = getTotals();
    const active = getActiveDictionary();
    const saved = dictionaries.flatMap((dict) => dict.words.filter((w) => w.isFavourite).map((word) => ({ word, dict })));

    return [
        screenHeader([`${t("home.greeting")} `, h("span", { class: "gradient-text" }, username), " 👋"], t("home.mood")),
        h("div", { class: "card" },
            h("div", { class: "stats-grid" },
                stat("📚", totals.dictionaries, t("home.dictionaries")),
                stat("🔤", totals.words.toLocaleString(getLocale()), t("home.words")),
                stat("★", totals.favourites, t("home.favourites")),
                stat("⏳", formatTime(totals.seconds), t("home.time"))),
            h("button", { class: "active-dict", type: "button", onClick: openDictionaryPicker },
                h("span", { class: "row-main" },
                    h("small", { class: "muted" }, t("home.active")),
                    h("strong", {}, active?.name ?? t("home.select")),
                    h("small", { class: "muted" }, active ? `${t("words.count", { count: active.words.length })} · ${t("home.change")}` : t("home.choose"))),
                h("span", { class: "active-emoji" }, active?.emoji ?? "📚"))),
        dictionaries.length > 0 && h("div", { class: "card" },
            h("h2", { class: "section-title" }, t("home.progress")),
            dictionaries.slice(0, 5).map((dict) => h("button", { class: "row row-btn", type: "button", onClick: () => openDictionary(dict.id) },
                h("span", { class: "row-main" }, h("strong", {}, dict.name),
                    h("small", { class: "muted" }, t("home.learned", { learned: countLearned(dict), total: dict.words.length }))),
                h("span", { class: "row-progress" }, h("strong", {}, `${getProgress(dict)}%`), progressBar(getProgress(dict)))))),
        h("div", { class: "card" },
            h("h2", { class: "section-title" }, t("home.saved")),
            saved.length
                ? h("div", { class: "tags" }, saved.slice(0, 20).map(({ word, dict }) => h("span", { class: "tag" }, word.word, " ", h("span", { class: "muted" }, dict.emoji))))
                : h("p", { class: "muted" }, t("home.savedEmpty"))),
    ].filter(Boolean);
}
