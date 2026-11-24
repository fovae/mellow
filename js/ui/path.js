import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { buildPath } from "../core/lessons.js";
import { icon } from "./icons.js";
import { openLesson } from "./lesson.js";
import { openTest } from "./test-session.js";
import { mascot } from "./mascot.js";

// Any dictionary, including the user's own, becomes a winding path of lessons.
export function pathSection(dict) {
    const nodes = buildPath(dict.words);
    const finished = nodes.every((node) => node.done);
    return h("section", { class: "path", "aria-label": t("path.title") }, nodes.map((node, i) => {
        const isTest = node.type === "test";
        const title = isTest ? t("path.checkpoint") : t("path.number", { count: node.number });
        const hint = isTest ? t("path.checkpointText") : node.words.slice(0, 3).map((w) => w.translation).join(", ");
        const state = node.mastered ? "is-mastered" : node.done ? "is-done" : node.current ? "is-current" : "";
        const open = () => (isTest
            ? openTest([{ dictId: dict.id, only: new Set(node.words.map((w) => w.id)) }], { mode: "choice", reverse: false, count: 20 })
            : openLesson(dict.id, node.words.map((w) => w.id)));
        const el = h("button", { class: `path-node ${isTest ? "is-test" : ""} ${state}`, type: "button", disabled: isTest && !node.done, onClick: open },
            h("span", { class: "path-ring" }, h("span", { class: "path-dot" }, isTest ? icon("star") : node.mastered ? icon("star") : node.done ? icon("check") : node.current ? icon("play") : String(node.number))),
            h("span", { class: "path-text" }, h("strong", {}, title), h("small", { class: "muted" }, hint)),
            node.current && mascot("happy", "path-mascot"));
        el.style.setProperty("--shift", `${Math.round(Math.sin(i * 0.9) * 34)}px`);
        el.style.setProperty("--value", `${Math.round((node.progress ?? 0) * 100)}%`);
        return el;
    }), finished && h("p", { class: "muted path-end" }, t("path.finished")));
}
