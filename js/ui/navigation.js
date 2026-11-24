import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { icon } from "./icons.js";
import { attachScrollbar } from "./scrollbar.js";

const views = new Map();
let current = null;
let bar;

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
    current = name;
    views.forEach(({ section, tab }, key) => {
        section.classList.toggle("is-active", key === name);
        tab.classList.toggle("is-active", key === name);
        if (key === name) tab.setAttribute("aria-current", "page");
        else tab.removeAttribute("aria-current");
    });
    refresh();
}

export const getCurrentScreen = () => current;

export const screenHeader = (title, subtitle, action) =>
    h("header", { class: "screen-header" },
        h("div", {}, h("h1", { class: "screen-title" }, ...[title].flat()), h("p", { class: "muted" }, subtitle)),
        action);
