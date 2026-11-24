// The statistics sheet.
import { h } from "../core/dom.js";
import { t, formatTime } from "../core/i18n.js";
import { lastDays } from "../core/dates.js";
import { allWords, getDay, getTotals } from "../core/store.js";
import { openModal } from "./modal.js";
import { section, statTile, statusBar, statusLegend, weekChart } from "./parts.js";

export const accuracy = () => {
    const week = lastDays(7).map(getDay);
    const answers = week.reduce((sum, d) => sum + d.answers, 0);
    const correct = week.reduce((sum, d) => sum + d.correct, 0);
    return answers ? `${Math.round((correct / answers) * 100)}%` : "—";
};

export const openStats = () => openModal({
    title: t("profile.stats"),
    build: () => h("div", { class: "stack" },
        section(t("home.week"), weekChart()),
        section(t("profile.words"), statusBar(allWords()), statusLegend(allWords())),
        h("div", { class: "stats-grid" }, statTile(accuracy(), t("profile.accuracy"), "stat-card"), statTile(formatTime(getTotals().seconds), t("profile.time"), "stat-card"))),
});
