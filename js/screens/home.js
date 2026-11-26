import { getLocale } from "../core/i18n.js";
import { h } from "../core/dom.js";
import { getState } from "../core/store.js";
import { dropsChip } from "../ui/rewards.js";
import { screenHeader } from "../ui/navigation.js";
import { greeting, todayHero, widgetGrid } from "../ui/widgets.js";

export function renderHome() {
    const { username } = getState();
    const date = new Date().toLocaleDateString(getLocale(), { weekday: "long", day: "numeric", month: "long" });
    return [
        screenHeader(date, [`${greeting()}, `, h("span", { class: "gradient-text" }, username)], dropsChip()),
        todayHero(),
        widgetGrid(),
    ];
}
