import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { startOfDay } from "../core/dates.js";
import { getActiveDictionary, getDictQueue } from "../core/store.js";
import { screenHeader } from "../ui/navigation.js";
import { heroCard } from "../ui/hero.js";
import { section, statTile, statusBar, statusLegend } from "../ui/parts.js";

export function renderCards() {
    const dict = getActiveDictionary();
    const nodes = [screenHeader(t("cards.eyebrow"), t("cards.title")), heroCard()];
    if (dict?.words.length) {
        const { due, soon, fresh } = getDictQueue(dict);
        const now = Date.now();
        const between = (from, to) => dict.words.filter((w) => w.srs && w.srs.due >= startOfDay(now, from) && w.srs.due < startOfDay(now, to)).length;
        nodes.push(
            h("div", { class: "stats-grid" },
                statTile(due.length + soon.length, t("cards.due"), "stat-card"), statTile(fresh.length, t("cards.fresh"), "stat-card")),
            section(t("profile.words"), statusBar(dict.words), statusLegend(dict.words)),
            section(t("cards.next"), h("div", { class: "stats-grid" },
                statTile(between(1, 2), t("cards.tomorrow")), statTile(between(1, 8), t("cards.inWeek")))));
    }
    nodes.push(section(null, h("details", {}, h("summary", { class: "section-title" }, t("cards.how")), h("p", { class: "muted" }, t("cards.howText")))));
    return nodes;
}
