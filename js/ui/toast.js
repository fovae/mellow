import { h } from "../core/dom.js";

// Short messages above everything, including dialogs. Shown one by one.
const queue = [];
let busy = false;

export function toast(emoji, title, text = "") {
    queue.push({ emoji, title, text });
    if (!busy) next();
}

function next() {
    const item = queue.shift();
    busy = Boolean(item);
    if (!item) return;
    const el = h("div", { class: "toast", role: "status", popover: "manual" },
        h("span", { class: "toast-emoji", "aria-hidden": "true" }, item.emoji),
        h("span", { class: "row-main" }, h("strong", {}, item.title), item.text && h("small", {}, item.text)));
    document.body.append(el);
    // The top layer is needed to be seen over a dialog.
    el.showPopover?.();
    setTimeout(() => el.classList.add("is-leaving"), 2200);
    setTimeout(() => { el.remove(); next(); }, 2500);
}

export function confetti(parent) {
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const box = h("div", { class: "confetti", "aria-hidden": "true" }, Array.from({ length: 28 }, (_, i) => h("i", {
        style: { left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 0.5}s`, animationDuration: `${1.6 + Math.random()}s`, opacity: String(0.6 + (i % 4) / 10) },
        class: `confetti-${i % 4}`,
    })));
    parent.append(box);
    setTimeout(() => box.remove(), 3500);
}
