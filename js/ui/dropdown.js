import { art } from "./art.js";
import { h } from "../core/dom.js";
import { openChoice } from "./cells.js";
import { icon } from "./icons.js";

// Replaces <select> in forms: a button that opens a sheet. options: [{ value, name, emoji? }]
// The element has .value and fires "change".
export function dropdown({ label, options, value, onChange, className = "" }) {
    const text = h("span", { class: "dropdown-text" });
    const el = h("button", {
        class: `input dropdown ${className}`, type: "button", "aria-haspopup": "dialog",
        onClick: () => openChoice({
            label, options, value: el.value,
            onPick: (next) => {
                set(next);
                el.dispatchEvent(new Event("change"));
                onChange?.(next);
            },
        }),
    }, text, icon("down"));
    const set = (next) => {
        const option = options.find((o) => String(o.value) === String(next)) ?? options[0];
        el.value = String(option.value);
        text.replaceChildren(...[option.emoji && art(option.emoji), option.name].filter(Boolean));
        el.setAttribute("aria-label", `${label}: ${option.name}`);
    };
    el.select = set;
    set(value);
    return el;
}
