import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { icon } from "./icons.js";

// The only modal in the app. Native <dialog> provides focus trapping and Escape.
// build(close) returns the body nodes.
export function openModal({ title, build, dismissible = true, className = "", actions = [] }) {
    const dialog = h("dialog", { class: `modal ${className}`, "aria-label": title });
    // Plays the exit animation, then closes.
    const close = () => {
        if (dialog.classList.contains("is-closing")) return;
        dialog.classList.add("is-closing");
        setTimeout(() => dialog.close(), matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 180);
    };

    dialog.append(h("div", { class: "modal-panel" },
        h("header", { class: "modal-header" },
            h("h2", { class: "modal-title" }, title),
            ...actions,
            dismissible && h("button", { class: "icon-btn", type: "button", "aria-label": t("common.close"), onClick: close }, icon("close"))),
        h("div", { class: "modal-body" }, build(close))));

    dialog.addEventListener("close", () => dialog.remove());
    dialog.addEventListener("click", (event) => {
        if (dismissible && event.target === dialog) close();
    });
    if (dismissible) {
        dialog.addEventListener("cancel", (event) => {
            event.preventDefault();
            close();
        });
    } else {
        // Chrome closes on a second Escape even when "cancel" is prevented, so block the key too.
        dialog.addEventListener("cancel", (event) => event.preventDefault());
        dialog.addEventListener("keydown", (event) => event.key === "Escape" && event.preventDefault());
    }

    document.body.append(dialog);
    dialog.showModal();
    return close;
}

export function confirmModal({ title, text, action, onConfirm }) {
    openModal({
        title,
        build: (close) => [
            h("p", { class: "muted" }, text),
            h("div", { class: "actions" },
                h("button", { class: "btn btn-soft", type: "button", onClick: close }, t("common.cancel")),
                h("button", { class: "btn btn-danger", type: "button", onClick: () => { close(); onConfirm(); } }, action)),
        ],
    });
}

export const field = (label, control) =>
    h("label", { class: "field" }, h("span", { class: "field-label" }, label), control);

export function form({ onSubmit, onCancel }, ...children) {
    return h("form", { class: "form", onSubmit: (event) => { event.preventDefault(); onSubmit(); } },
        ...children,
        h("div", { class: "actions" },
            onCancel && h("button", { class: "btn btn-soft", type: "button", onClick: onCancel }, t("common.cancel")),
            h("button", { class: "btn btn-primary", type: "submit" }, t("common.save"))));
}

export function requireValue(input) {
    if (input.value.trim()) return true;
    input.classList.remove("is-shaking");
    void input.offsetWidth; // restart the animation
    input.classList.add("is-shaking");
    input.focus();
    return false;
}

// Full-screen flow (study, test). draw(nodes) replaces the content.
export function openFullscreen(label, onKey) {
    const body = h("div", { class: "session" });
    const dialog = h("dialog", { class: "modal modal-full", "aria-label": label }, body);
    if (onKey) dialog.addEventListener("keydown", onKey);
    dialog.addEventListener("close", () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
    return { draw: (...nodes) => body.replaceChildren(...nodes.filter(Boolean)), close: () => dialog.close() };
}
