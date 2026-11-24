// Grouped lists: the building blocks of settings and of every menu.
import { art } from "./art.js";
import { h } from "../core/dom.js";
import { openModal } from "./modal.js";
import { icon } from "./icons.js";

// A small title, one card with rows and an optional note under it.
export const group = (title, rows, { foot, className = "" } = {}) => h("section", { class: `group ${className}` },
    title && h("h2", { class: "group-title" }, title),
    h("div", { class: "group-card" }, rows),
    foot && h("p", { class: "group-foot" }, foot));

// icon: name of an icon on a coloured tile (tint 1-6, "danger"); emoji: a picture from art.js instead.
// onClick / href make the whole row a button / link; a control makes it a label.
// tall: the control goes under the label.
export function cell({ icon: name, tint = 1, emoji, label, sub, value, control, onClick, href, danger, disabled, tall, chevron = true, className = "", attrs = {} }) {
    const tag = href ? "a" : onClick ? "button" : control && !tall ? "label" : "div";
    const props = {
        class: `cell ${onClick || href ? "is-tap" : ""} ${danger ? "is-danger" : ""} ${tall ? "is-tall" : ""} ${className}`,
        ...(onClick ? { type: "button", onClick, disabled } : {}),
        ...(href ? { href, ...(href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {}) } : {}),
        ...attrs,
    };
    const hasValue = value !== undefined && value !== null && value !== false;
    return h(tag, props,
        name && h("span", { class: `cell-icon tint-${danger ? "danger" : tint}`, "aria-hidden": "true" }, icon(name)),
        emoji && h("span", { class: "cell-emoji", "aria-hidden": "true" }, art(emoji)),
        h("span", { class: "cell-text" }, h("span", { class: "cell-label" }, label), sub && (typeof sub === "string" ? h("small", { class: "cell-sub" }, sub) : sub)),
        hasValue && h("span", { class: "cell-value" }, value),
        control && h("span", { class: "cell-control" }, control),
        (onClick || href) && chevron && !danger && icon(href?.startsWith("http") ? "external" : "chevron"));
}

// A sheet with one choice. options: [{ value, name, emoji? }]
export function openChoice({ label, options, value, onPick }) {
    openModal({
        title: label,
        build: (close) => h("div", { class: "group-card", role: "listbox", "aria-label": label }, options.map((option) => {
            const isActive = String(option.value) === String(value);
            return h("button", {
                class: `cell is-tap ${isActive ? "is-active" : ""}`, type: "button", role: "option", "aria-selected": String(isActive), "data-value": String(option.value),
                onClick: () => { close(); if (!isActive) onPick(option.value); },
            }, option.emoji && h("span", { class: "cell-emoji", "aria-hidden": "true" }, art(option.emoji)),
                h("span", { class: "cell-text" }, h("span", { class: "cell-label" }, option.name)),
                isActive && icon("check"));
        })),
    });
}

// A row that shows the current value and opens the choice.
export const choiceCell = ({ options, value, onPick, ...rest }) => cell({
    ...rest,
    value: options.find((o) => String(o.value) === String(value))?.name ?? String(value),
    attrs: { "aria-haspopup": "dialog" },
    onClick: () => openChoice({ label: rest.label, options, value, onPick }),
});
