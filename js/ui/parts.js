// Small shared building blocks.
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { countStatuses, getDay } from "../core/store.js";
import { lastDays } from "../core/dates.js";
import { canSpeak, speak } from "../core/speech.js";
import { icon } from "./icons.js";

export const sessionHeader = (onClose, fill, count = "") => h("header", { class: "session-header" },
    h("button", { class: "icon-btn", type: "button", "aria-label": t("common.close"), onClick: onClose }, icon("close")),
    h("div", { class: "bar" }, h("div", { class: "bar-fill", style: { width: `${fill * 100}%` } })),
    h("span", { class: "muted session-count" }, count));

export const statTile = (value, label, className = "") => h("div", { class: `stat ${className}` },
    h("span", { class: "stat-value" }, value), h("span", { class: "muted" }, label));

export const section = (title, ...children) => h("section", { class: "card" }, title && h("h2", { class: "section-title" }, title), ...children);

export function segmented(label, options, value, onChange) {
    return h("div", { class: "segmented", role: "group", "aria-label": label }, options.map((option) => h("button", {
        class: `segment ${option.value === value ? "is-active" : ""}`, type: "button", "aria-pressed": String(option.value === value),
        onClick: () => option.value !== value && onChange(option.value),
    }, option.label)));
}

// New / learning / mastered in one bar.
export function statusBar(words) {
    const counts = countStatuses(words);
    const label = ["mastered", "learning", "new"].map((key) => `${t(`status.${key}`)}: ${counts[key]}`).join(", ");
    return h("div", { class: "status-bar", role: "img", "aria-label": label },
        ["mastered", "learning"].map((key) => counts[key] > 0 && h("span", { class: `is-${key}`, style: { flexGrow: String(counts[key]) } })),
        counts.new > 0 && h("span", { style: { flexGrow: String(counts.new) } }));
}

export function statusLegend(words) {
    const counts = countStatuses(words);
    return h("div", { class: "legend" }, ["mastered", "learning", "new"].map((key) =>
        h("span", {}, h("i", { class: `dot is-${key}` }), `${t(`status.${key}`)} `, h("strong", {}, counts[key]))));
}

export function ring(done, goal) {
    const percent = Math.min(100, Math.round((done / goal) * 100));
    const el = h("div", { class: "ring", role: "img", "aria-label": `${percent}%` }, h("span", {}, `${percent}%`));
    el.style.setProperty("--value", `${percent}%`);
    return el;
}

export function weekChart() {
    const days = lastDays(7).map((date) => ({ date, answers: getDay(date).answers }));
    const max = Math.max(10, ...days.map((d) => d.answers));
    return h("div", { class: "week" }, days.map(({ date, answers }, i) => h("div", { class: `week-day ${i === 6 ? "is-today" : ""}` },
        h("span", { class: "week-value" }, answers || ""),
        h("div", { class: "week-track" }, h("div", { class: "week-bar", style: { height: `${(answers / max) * 100}%` } })),
        h("span", { class: "muted" }, date.toLocaleDateString(getLocale(), { weekday: "short" })))));
}

export const speakButton = (text, language) => canSpeak() && h("button", {
    class: "icon-btn", type: "button", "aria-label": `${t("common.listen")}: ${text}`,
    onClick: (event) => { event.stopPropagation(); speak(text, language); },
}, icon("sound"));
