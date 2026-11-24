import { art } from "../ui/art.js";
import { h } from "../core/dom.js";
import { t, getLocale, languages, formatTime } from "../core/i18n.js";
import { allWords, getState, getTotals, getStreak, updateSettings, setUsername, resetAll } from "../core/store.js";
import { APP_VERSION } from "../core/version.js";
import { getAchievements } from "../core/achievements.js";
import { levelInfo, totalXp } from "../core/rewards.js";
import { play } from "../core/sound.js";
import { canSpeak, speak } from "../core/speech.js";
import { screenHeader } from "../ui/navigation.js";
import { openModal, confirmModal, form, field, requireValue } from "../ui/modal.js";
import { saveBackup, restoreBackup } from "../ui/transfer-modals.js";
import { cell, choiceCell, group } from "../ui/cells.js";
import { dropsChip, openAccents, openShop } from "../ui/rewards.js";
import { icon } from "../ui/icons.js";
import { profilesGroup } from "../ui/profiles.js";
import { mascot } from "../ui/mascot.js";
import { segmented } from "../ui/parts.js";
import { accuracy, openStats } from "../ui/stats.js";

const CONTACTS = [
    { id: "instagram", name: "Instagram", handle: "vfovae", href: "https://www.instagram.com/vfovae/" },
    { id: "telegram", name: "Telegram", handle: "fovae", href: "https://t.me/fovae" },
    { id: "discord", name: "Discord", handle: "fovae", href: "https://discord.com/users/1468713991852396557" },
];

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

const badges = () => {
    const { log, settings } = getState();
    const { mastered, words } = getTotals();
    return getAchievements({ log, mastered, words, dailyGoal: settings.dailyGoal });
};

function profileCard() {
    const { username, log } = getState();
    const { level, done, need } = levelInfo(totalXp(log));
    const stat = (value, label) => h("div", { class: "profile-stat" }, h("strong", {}, value), h("small", { class: "muted" }, label));
    return h("section", { class: "card profile-card" },
        h("div", { class: "profile-head" },
            h("span", { class: "profile-avatar" }, mascot("happy")),
            h("div", { class: "row-main" }, h("h2", { class: "profile-name" }, username), h("span", { class: "badge" }, t("level.title", { level }))),
            h("button", { class: "icon-btn icon-btn-soft", type: "button", "aria-label": t("profile.name"), onClick: editName }, icon("edit"))),
        h("div", { class: "profile-level" },
            h("div", { class: "bar" }, h("div", { class: "bar-fill", style: { width: `${(done / need) * 100}%` } })),
            h("small", { class: "muted" }, t("level.left", { count: need - done }))),
        h("div", { class: "profile-stats" },
            stat([art("🔥"), ` ${getStreak()}`], t("profile.streak")),
            stat(accuracy(), t("profile.accuracyShort")),
            stat(formatTime(getTotals().seconds), t("profile.time"))));
}

const openBadges = () => openModal({
    title: t("profile.badges"),
    build: () => group(null, [...badges()].sort((a, b) => b.done - a.done).map((b) => cell({
        emoji: b.emoji, label: t(`badge.${b.id}`), className: b.done ? "" : "is-locked",
        sub: b.done ? t("badge.done") : h("span", { class: "cell-progress" }, h("span", { class: "bar" }, h("span", { class: "bar-fill", style: { width: `${Math.min(100, (b.value / b.goal) * 100)}%` } })), h("small", {}, `${b.value} / ${b.goal}`)),
        value: b.done && icon("check"),
    }))),
});

const set = (key) => (value) => updateSettings({ [key]: value });
const numbers = (...values) => values.map((value) => ({ value, name: String(value) }));

// A switch moves by itself, so the screen is not redrawn.
const toggle = (key, rest, onChange) => cell({
    ...rest,
    control: h("input", {
        class: "switch", type: "checkbox", role: "switch", "aria-label": rest.label, checked: getState().settings[key],
        onChange: (event) => { updateSettings({ [key]: event.target.checked }, "switch"); onChange?.(event.target.checked); },
    }),
});

const choose = (key, rest, options) => choiceCell({ ...rest, options, value: getState().settings[key], onPick: set(key) });

export function renderProfile() {
    const { settings, lastBackup, drops } = getState();
    const list = badges();
    const sample = () => speak(t("settings.speechSample"), getLocale() === "ru" ? "Russian" : "English");

    return [
        screenHeader(t("profile.eyebrow"), t("tab.profile"), dropsChip()),
        profileCard(),
        group(t("settings.progress"), [
            cell({ icon: "chart", tint: 1, label: t("profile.stats"), value: t("words.count", { count: allWords().length }), attrs: { "aria-haspopup": "dialog" }, onClick: openStats }),
            cell({ icon: "trophy", tint: 2, label: t("profile.badges"), value: `${list.filter((b) => b.done).length} / ${list.length}`, attrs: { "aria-haspopup": "dialog" }, onClick: openBadges }),
            cell({ icon: "drop", tint: 3, label: t("shop.title"), value: String(drops), attrs: { "aria-haspopup": "dialog" }, onClick: openShop }),
        ]),
        profilesGroup(),
        group(t("profile.learning"), [
            choose("dailyGoal", { icon: "target", tint: 3, label: t("profile.goal") }, numbers(10, 20, 30, 50, 100)),
            choose("newPerDay", { icon: "plus", tint: 4, label: t("profile.newPerDay") }, numbers(5, 10, 15, 20, 30)),
            toggle("reverse", { icon: "swap", tint: 5, label: t("profile.reverse") }),
        ], { foot: t("settings.reverseNote") }),
        group(t("settings.sound"), [
            toggle("sound", { icon: "sound", tint: 1, label: t("profile.sound") }, (on) => on && play("right")),
            "vibrate" in navigator && toggle("haptics", { icon: "phone", tint: 2, label: t("settings.haptics") }, (on) => on && navigator.vibrate(20)),
            canSpeak() && toggle("autoSpeak", { icon: "speech", tint: 3, label: t("profile.autoSpeak") }),
            canSpeak() && choiceCell({
                icon: "timer", tint: 4, label: t("settings.speechRate"), value: settings.speechRate,
                options: ["slow", "normal", "fast"].map((value) => ({ value, name: t(`speechRate.${value}`) })),
                onPick: (value) => { set("speechRate")(value); sample(); },
            }),
        ]),
        group(t("profile.appearance"), [
            cell({
                icon: "moon", tint: 1, label: t("profile.theme"), tall: true,
                control: segmented(t("profile.theme"), ["auto", "light", "dark"].map((value) => ({ value, label: t(`theme.${value}`) })), settings.theme, set("theme")),
            }),
            cell({ icon: "palette", tint: 2, label: t("accent.title"), value: t(`accent.${settings.accent}`), attrs: { "aria-haspopup": "dialog" }, onClick: openAccents }),
            choose("language", { icon: "text", tint: 3, label: t("profile.language") }, languages.map(({ code, name }) => ({ value: code, name }))),
            toggle("motion", { icon: "spark", tint: 4, label: t("settings.motion") }),
        ]),
        group(t("profile.data"), [
            cell({
                icon: "share", tint: 1, label: t("settings.backup"), onClick: saveBackup,
                sub: lastBackup ? new Date(lastBackup).toLocaleDateString(getLocale(), { day: "numeric", month: "long", year: "numeric" }) : t("backup.never"),
            }),
            cell({ icon: "download", tint: 2, label: t("settings.restore"), onClick: restoreBackup }),
            toggle("backupReminder", { icon: "bell", tint: 3, label: t("settings.backupReminder") }),
        ], { foot: t("backup.text") }),
        group(null, [cell({
            icon: "trash", danger: true, label: t("profile.reset"),
            onClick: () => confirmModal({ title: t("profile.resetTitle"), text: t("profile.resetText"), action: t("common.delete"), onConfirm: resetAll }),
        })]),
        group(t("settings.contacts"), CONTACTS.map(({ id, name, handle, href }, i) => cell({ icon: id, tint: i + 1, label: name, value: handle, href })), { foot: t("settings.contactsNote") }),
        group(t("profile.about"), [
            cell({ icon: "shield", tint: 1, label: t("profile.privacy"), href: "privacy.html" }),
            cell({ icon: "layers", tint: 2, label: t("profile.terms"), href: "terms.html" }),
            cell({ icon: "info", tint: 3, label: t("profile.version"), value: APP_VERSION }),
        ]),
        h("p", { class: "credits" }, `${t("loader.created")} `, h("strong", { class: "gradient-text" }, "fovae")),
    ];
}
