import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { icon } from "./icons.js";
import { attachScrollbar } from "./scrollbar.js";

const views = new Map();
let current = null;
let bar;
let enterTimer;

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

export function refresh() {
    bar.setAttribute("aria-label", t("nav.label"));
    views.forEach(({ label }, name) => { label.textContent = t(`tab.${name}`); });
    const view = views.get(current);
    view?.content.replaceChildren(...view.render());
}

export function navigate(name) {
    if (current === name) views.get(name).content.scrollTo({ top: 0, behavior: "smooth" });
    current = name;
    views.forEach(({ section, tab }, key) => {
        section.classList.toggle("is-active", key === name);
        section.classList.toggle("is-entering", key === name);
        tab.classList.toggle("is-active", key === name);
        if (key === name) tab.setAttribute("aria-current", "page");
        else tab.removeAttribute("aria-current");
    });
    refresh();
    // Later redraws of the same screen must stay still.
    clearTimeout(enterTimer);
    enterTimer = setTimeout(() => views.get(name).section.classList.remove("is-entering"), 900);
}

export const screenHeader = (eyebrow, title, action) =>
    h("header", { class: "screen-header" },
        h("div", {}, h("p", { class: "eyebrow" }, eyebrow), h("h1", { class: "screen-title" }, ...[title].flat())),
        action);
