import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { getState, getDay, getStreak } from "../core/store.js";
import { screenHeader } from "../ui/navigation.js";
import { heroCard } from "../ui/hero.js";
import { ring, section, weekChart } from "../ui/parts.js";

export function renderHome() {
    const { username, dictionaries, settings } = getState();
    const { answers } = getDay();
    const streak = getStreak();
    const saved = dictionaries.flatMap((dict) => dict.words.filter((w) => w.isFavourite).map((word) => ({ word, dict })));
    const date = new Date().toLocaleDateString(getLocale(), { weekday: "short", day: "numeric", month: "long" });

    return [
        screenHeader(date, [`${t("home.greeting")} `, h("span", { class: "gradient-text" }, username)],
            h("div", { class: "streak", role: "img", "aria-label": `${t("profile.streak")}: ${streak}` }, h("span", {}, "🔥"), h("strong", {}, streak))),
        heroCard(),
        h("section", { class: "card goal" }, ring(answers, settings.dailyGoal),
            h("div", { class: "row-main" }, h("h2", { class: "section-title" }, t("home.goal")),
                h("p", { class: "muted" }, answers >= settings.dailyGoal ? t("home.goalDone") : t("home.goalText", { done: answers, goal: settings.dailyGoal })))),
        section(t("home.week"), weekChart()),
        section(t("home.saved"), saved.length
            ? h("div", { class: "tags" }, saved.slice(0, 20).map(({ word, dict }) =>
                h("span", { class: "tag" }, h("strong", {}, word.word), ` ${word.translation} `, dict.emoji)))
            : h("p", { class: "muted" }, t("home.savedEmpty"))),
    ];
}
