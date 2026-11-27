import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { icon } from "./icons.js";
import { attachScrollbar } from "./scrollbar.js";

const views = new Map();
let current = null;
let bar;
let enterTimer;
let pending = 0;

// screens: { name: render }. render() returns the nodes of the screen.
export function initNavigation(screens) {
    const main = document.getElementById("main");
    bar = document.getElementById("tabBar");

    for (const [name, render] of Object.entries(screens)) {
        const content = h("div", { class: "screen-scroll" });
        const section = h("section", { class: "screen" }, content, h("div", { class: "scroll-thumb" }));
        attachScrollbar(section, content);

        const label = h("span", { class: "tab-label" });
        const tab = h("button", { class: "tab", type: "button", onClick: () => navigate(name) }, icon(name), label);

        main.append(section);
        bar.append(tab);
        views.set(name, { render, section, content, tab, label });
    }
}

// Something changed: the screen in view is drawn again, the others when they are opened next.
export function refresh() {
    bar.setAttribute("aria-label", t("nav.label"));
    views.forEach((view, name) => {
        view.label.textContent = t(`tab.${name}`);
        view.stale = true;
    });
    draw(current);
}

// After the start, while nothing happens: the other screens are built ahead, one per task, so the first visit
// to a tab is only a change of classes too. Skipped while a window is open or something is pressed.
export function prepareScreens() {
    const next = () => {
        const name = [...views.keys()].find((key) => key !== current && views.get(key).stale !== false);
        if (!name) return;
        if (!document.querySelector("dialog[open]") && !document.querySelector(":active")) draw(name);
        setTimeout(next, 250);
    };
    setTimeout(next, 1500);
}

// Changes that must not redraw the screen in view (the study timer) still reach the others.
export const markStale = () => views.forEach((view, name) => { if (name !== current) view.stale = true; });

function draw(name) {
    const view = views.get(name);
    if (!view) return;
    view.content.replaceChildren(...view.render());
    view.stale = false;
}

// The tab lights up in the frame of the tap; the screen is drawn just after that frame is painted,
// so building it never holds the press back (on a phone that takes tens of milliseconds).
export function navigate(name, { now = false } = {}) {
    if (current === name && !pending) {
        views.get(name).content.scrollTo({ top: 0, behavior: "smooth" });
        return refresh();
    }
    views.forEach(({ tab }, key) => {
        tab.classList.toggle("is-active", key === name);
        if (key === name) tab.setAttribute("aria-current", "page");
        else tab.removeAttribute("aria-current");
    });
    cancelAnimationFrame(pending);
    const show = () => {
        pending = 0;
        current = name;
        // A screen opened again with nothing changed is not rebuilt: switching is only a change of classes.
        if (views.get(name).stale !== false) draw(name);
        views.forEach(({ section }, key) => {
            section.classList.toggle("is-active", key === name);
            section.classList.toggle("is-entering", key === name);
        });
        // Later redraws of the same screen must stay still.
        clearTimeout(enterTimer);
        enterTimer = setTimeout(() => views.get(name).section.classList.remove("is-entering"), 400);
    };
    if (now || current === null) return show();
    pending = requestAnimationFrame(() => { pending = requestAnimationFrame(show); });
}

export const screenHeader = (eyebrow, title, action) =>
    h("header", { class: "screen-header" },
        h("div", {}, h("p", { class: "eyebrow" }, eyebrow), h("h1", { class: "screen-title" }, ...[title].flat())),
        action);
