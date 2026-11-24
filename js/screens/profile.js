import { h } from "../core/dom.js";
import { t, getLocale, languages, formatTime } from "../core/i18n.js";
import { lastDays } from "../core/dates.js";
import { getState, getTotals, getDay, getStreak, allWords, updateSettings, setUsername, resetAll } from "../core/store.js";
import { getAchievements } from "../core/achievements.js";
import { canSpeak } from "../core/speech.js";
import { screenHeader } from "../ui/navigation.js";
import { openModal, confirmModal, form, field, requireValue } from "../ui/modal.js";
import { saveBackup, restoreBackup } from "../ui/transfer-modals.js";
import { icon } from "../ui/icons.js";
import { section, segmented, statTile, statusBar, statusLegend, weekChart } from "../ui/parts.js";

const line = (label, control) => h("div", { class: "row" }, h("span", { class: "row-main" }, label), control);

function editName() {
    const input = h("input", { class: "input", value: getState().username, maxlength: 30, autocomplete: "given-name" });
    openModal({
        title: t("profile.name"),
        build: (close) => form({
            onCancel: close,
            onSubmit: () => { if (requireValue(input)) { close(); setUsername(input.value.trim()); } },
        }, field(t("profile.name"), input)),
    });
}

const select = (label, key, options) => h("select", {
    class: "input input-inline", "aria-label": label,
    onChange: (event) => updateSettings({ [key]: options[event.target.selectedIndex].value }),
}, options.map(({ value, name }) => h("option", { selected: value === getState().settings[key] }, name)));

const toggle = (label, key) => h("input", {
    class: "switch", type: "checkbox", role: "switch", "aria-label": label, checked: getState().settings[key],
    onChange: (event) => updateSettings({ [key]: event.target.checked }),
});

const numbers = (...values) => values.map((value) => ({ value, name: String(value) }));

export function renderProfile() {
    const { username, settings, lastBackup, log } = getState();
    const totals = getTotals();
    const week = lastDays(7).map(getDay);
    const answers = week.reduce((sum, d) => sum + d.answers, 0);
    const badges = getAchievements({ log, mastered: totals.mastered, words: totals.words, dailyGoal: settings.dailyGoal });
    const correct = week.reduce((sum, d) => sum + d.correct, 0);

    return [
        screenHeader(t("profile.eyebrow"), username,
            h("button", { class: "icon-btn icon-btn-soft", type: "button", "aria-label": t("profile.name"), onClick: editName }, icon("edit"))),
        h("div", { class: "stats-grid stats-grid-3" },
            statTile(`🔥 ${getStreak()}`, t("profile.streak"), "stat-card"),
            statTile(answers ? `${Math.round((correct / answers) * 100)}%` : "—", t("profile.accuracy"), "stat-card"),
            statTile(formatTime(totals.seconds), t("profile.time"), "stat-card")),
        section(t("home.week"), weekChart()),
        section(t("profile.words"), statusBar(allWords()), statusLegend(allWords())),
        section(`${t("profile.badges")} · ${badges.filter((b) => b.done).length}/${badges.length}`,
            h("div", { class: "badges" }, badges.map((b) => h("div", { class: `achievement ${b.done ? "is-done" : ""}` },
                h("span", { class: "achievement-emoji", "aria-hidden": "true" }, b.emoji),
                h("strong", {}, t(`badge.${b.id}`)),
                h("small", { class: "muted" }, b.done ? t("badge.done") : `${b.value} / ${b.goal}`))))),
        section(t("profile.learning"),
            line(t("profile.goal"), select(t("profile.goal"), "dailyGoal", numbers(10, 20, 30, 50, 100))),
            line(t("profile.newPerDay"), select(t("profile.newPerDay"), "newPerDay", numbers(5, 10, 15, 20, 30))),
            line(t("profile.reverse"), toggle(t("profile.reverse"), "reverse")),
            canSpeak() && line(t("profile.autoSpeak"), toggle(t("profile.autoSpeak"), "autoSpeak"))),
        section(t("profile.appearance"),
            segmented(t("profile.theme"), ["auto", "light", "dark"].map((value) => ({ value, label: t(`theme.${value}`) })), settings.theme, (theme) => updateSettings({ theme })),
            line(t("profile.language"), select(t("profile.language"), "language", languages.map(({ code, name }) => ({ value: code, name }))))),
        section(t("profile.data"),
            h("p", { class: "muted" }, t("backup.text")),
            line(t("backup.last"), h("span", { class: "muted" }, lastBackup ? new Date(lastBackup).toLocaleDateString(getLocale(), { day: "numeric", month: "short", year: "numeric" }) : t("backup.never"))),
            h("div", { class: "actions" },
                h("button", { class: "btn btn-soft", type: "button", onClick: restoreBackup }, t("backup.restore")),
                h("button", { class: "btn btn-primary", type: "button", onClick: saveBackup }, t("backup.save"))),
            h("button", {
                class: "btn btn-danger-soft btn-wide form-extra", type: "button",
                onClick: () => confirmModal({ title: t("profile.resetTitle"), text: t("profile.resetText"), action: t("common.delete"), onConfirm: resetAll }),
            }, t("profile.reset"))),
    ];
}
