import { h } from "../core/dom.js";
import { openModal } from "./modal.js";
import { icon } from "./icons.js";

// Replaces <select>: a button that opens a sheet. options: [{ value, name, emoji? }]
// The element has .value and fires "change".
export function dropdown({ label, options, value, onChange, className = "" }) {
    const text = h("span", { class: "dropdown-text" });
    const el = h("button", { class: `input dropdown ${className}`, type: "button", "aria-haspopup": "dialog", onClick: open }, text, icon("down"));
    const set = (next) => {
        const option = options.find((o) => String(o.value) === String(next)) ?? options[0];
        el.value = String(option.value);
        text.textContent = [option.emoji, option.name].filter(Boolean).join(" ");
        el.setAttribute("aria-label", `${label}: ${option.name}`);
    };
    el.select = set;

    function open() {
        openModal({
            title: label,
            build: (close) => h("div", { class: "card list", role: "listbox", "aria-label": label }, options.map((option) => {
                const isActive = String(option.value) === el.value;
                return h("button", {
                    class: `row row-btn ${isActive ? "is-active" : ""}`, type: "button", role: "option", "aria-selected": String(isActive), "data-value": String(option.value),
                    onClick: () => {
                        close();
                        if (isActive) return;
                        set(option.value);
                        el.dispatchEvent(new Event("change"));
                        onChange?.(option.value);
                    },
                }, option.emoji && h("span", { class: "row-emoji" }, option.emoji),
                    h("span", { class: "row-main" }, h("strong", {}, option.name)), isActive && icon("check"));
            })),
        });
    }

    set(value);
    return el;
}
