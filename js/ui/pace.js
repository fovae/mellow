// The pace: how many new words, per day or per week. Shared by the first screen and the settings.
// settings.newPerDay is the number, settings.paceUnit says whether it is per "day" or per "week".
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { icon } from "./icons.js";
import { openModal } from "./modal.js";

export const PRESETS = [
    { count: 5, art: "🌱" },
    { count: 10, art: "🏃" },
    { count: 20, art: "🚀" },
];
export const LIMITS = { day: 50, week: 100 };

const clamp = (value, max) => Math.min(max, Math.max(1, Math.round(value)));
export const isPreset = ({ count, unit }) => unit === "day" && PRESETS.some((p) => p.count === count);

// Answers a day that fit the pace: about two per new word, at least 10. A weekly pace keeps the floor.
export const goalFor = ({ count, unit }) => (unit === "week" ? 10 : Math.max(10, Math.min(60, Math.round((count * 2) / 5) * 5)));

// "5 a day", "3 a week".
export const paceLabel = ({ count, unit }) => t(`pace.per.${unit}`, { count });

// The calculator under the choice: what the pace gives in a month and in a year.
export function paceForecast({ count, unit }) {
    const format = (n) => n.toLocaleString(getLocale());
    const month = unit === "day" ? count * 30 : Math.round((count * 52) / 12);
    const year = unit === "day" ? count * 365 : count * 52;
    return t("pace.forecast", { month: format(month), year: format(year) });
}

// The sheet of an own pace: − and + (holding repeats faster), per day or per week. No keyboard on purpose.
export function openPaceSheet(value, onDone) {
    let { count, unit } = value;
    openModal({
        title: t("pace.custom"),
        build: (close) => {
            const number = h("strong", { class: "stepper-value", "aria-live": "polite" });
            const forecast = h("p", { class: "muted pace-forecast" });
            const units = ["day", "week"].map((name) => h("button", {
                class: "segment", type: "button", "data-value": name,
                onClick: () => { unit = name; count = clamp(count, LIMITS[unit]); update(); },
            }, t(`pace.unit.${name}`)));
            const update = () => {
                number.textContent = String(count);
                units.forEach((el) => {
                    el.classList.toggle("is-active", el.dataset.value === unit);
                    el.setAttribute("aria-pressed", String(el.dataset.value === unit));
                });
                minus.disabled = count <= 1;
                plus.disabled = count >= LIMITS[unit];
                forecast.textContent = paceForecast({ count, unit });
            };
            // Holding the button repeats, faster and faster.
            const step = (delta, label, name) => {
                let timer;
                const stop = () => clearTimeout(timer);
                const go = (delay) => {
                    count = clamp(count + delta, LIMITS[unit]);
                    update();
                    timer = setTimeout(() => go(Math.max(50, delay * 0.8)), delay);
                };
                return h("button", {
                    class: "stepper-btn", type: "button", "aria-label": label,
                    onPointerdown: (event) => { event.preventDefault(); stop(); go(420); },
                    onPointerup: stop, onPointerleave: stop, onPointercancel: stop,
                    // Keyboard and screen readers: one step per press.
                    onClick: (event) => { if (event.detail === 0) { count = clamp(count + delta, LIMITS[unit]); update(); } },
                }, icon(name));
            };
            const minus = step(-1, t("pace.less"), "minus");
            const plus = step(1, t("pace.more"), "plus");
            update();
            return h("div", { class: "pace-sheet" },
                h("div", { class: "stepper" }, minus, number, plus),
                h("div", { class: "segmented", role: "group" }, units),
                forecast,
                h("button", { class: "btn btn-primary", type: "button", onClick: () => { close(); onDone({ count, unit }); } }, t("common.done")));
        },
    });
}
