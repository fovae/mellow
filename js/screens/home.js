import { t, getLocale } from "../core/i18n.js";
import { h } from "../core/dom.js";
import { getState, getAnswers } from "../core/store.js";
import { needsBackup } from "../core/advice.js";
import { getLocal } from "../core/account.js";
import { saveBackup } from "../ui/transfer-modals.js";
import { dropsChip } from "../ui/rewards.js";
import { cell, group } from "../ui/cells.js";
import { screenHeader } from "../ui/navigation.js";
import { greeting, todayHero, widgetGrid } from "../ui/widgets.js";

export function renderHome() {
    const { username, lastBackup, settings } = getState();
    const date = new Date().toLocaleDateString(getLocale(), { weekday: "long", day: "numeric", month: "long" });
    return [
        screenHeader(date, [`${greeting()}, `, h("span", { class: "gradient-text" }, username)], dropsChip()),
        todayHero(),
        widgetGrid(),
        settings.backupReminder && needsBackup({ answers: getAnswers(), lastBackup: Math.max(lastBackup ?? 0, getLocal()?.cloudAt ?? 0) || null })
            && group(null, [cell({ icon: "share", tint: 3, label: t("advice.backup"), sub: t("advice.backupText"), onClick: saveBackup })]),
    ].filter(Boolean);
}
