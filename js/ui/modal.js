import { art } from "./art.js";
import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { calmMotion } from "../core/theme.js";
import { icon } from "./icons.js";

// The only modal in the app. Native <dialog> provides focus trapping and Escape.
// build(close) returns the body nodes.
export function openModal({ title, emoji, build, dismissible = true, className = "", actions = [] }) {
    const dialog = h("dialog", { class: `modal ${className}`, "aria-label": title });
    // Plays the exit animation, then closes.
    const close = () => {
        if (dialog.classList.contains("is-closing")) return;
        dialog.classList.add("is-closing");
        setTimeout(() => dialog.close(), calmMotion() ? 0 : 180);
    };

    dialog.append(h("div", { class: "modal-panel" },
        dismissible && h("span", { class: "modal-grip", "aria-hidden": "true" }),
        h("header", { class: "modal-header" },
            h("h2", { class: "modal-title" }, emoji && art(emoji), title),
            ...actions,
            dismissible && h("button", { class: "icon-btn", type: "button", "aria-label": t("common.close"), onClick: close }, icon("close"))),
        h("div", { class: "modal-body" }, build(close))));

    if (dismissible) swipeToClose(dialog, close);
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

// A quick swipe down on the header, or anywhere while the sheet is at the top.
function swipeToClose(dialog, close) {
    const panel = dialog.firstElementChild;
    let start = null;
    dialog.addEventListener("touchstart", (event) => {
        const [touch] = event.touches;
        const onField = event.target.closest("input, textarea");
        const onTop = panel.scrollTop <= 0 || event.target.closest(".modal-header, .modal-grip");
        start = event.touches.length === 1 && !onField && onTop ? { x: touch.clientX, y: touch.clientY, time: Date.now() } : null;
    }, { passive: true });
    dialog.addEventListener("touchend", (event) => {
        if (!start) return;
        const [touch] = event.changedTouches;
        const down = touch.clientY - start.y;
        if (down > 70 && down > Math.abs(touch.clientX - start.x) * 2 && Date.now() - start.time < 700) close();
        start = null;
    });
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
export function openFullscreen(label, onKey, onCancel) {
    const body = h("div", { class: "session" });
    const dialog = h("dialog", { class: "modal modal-full", "aria-label": label }, body);
    if (onKey) dialog.addEventListener("keydown", onKey);
    if (onCancel) dialog.addEventListener("cancel", (event) => { event.preventDefault(); onCancel(); });
    dialog.addEventListener("close", () => dialog.remove());
    document.body.append(dialog);
    dialog.showModal();
    return { body, draw: (...nodes) => body.replaceChildren(...nodes.filter(Boolean)), close: () => dialog.close(), isOpen: () => dialog.open };
}
