// The guide after the first screen: short "stories" about where things are in Mellow.
// Tap on the right or left to move, hold to pause, swipe down or "Skip" to close.
// Each slide has a small picture of a screen; the highlighted tabs are the real ones of the tab bar.
import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { calmMotion } from "../core/theme.js";
import { art } from "./art.js";
import { icon } from "./icons.js";
import { openFullscreen } from "./modal.js";

export const SLIDE_MS = 5500; // the same in css/tour.css
const TABS = ["home", "dictionaries", "cards", "tests", "profile"];

const line = (width, extra = "") => h("span", { class: `tm-line ${extra}`, style: { width } });

function phone(tabs, ...content) {
    return h("div", { class: "tm-phone", "aria-hidden": "true" },
        h("div", { class: "tm-screen" }, ...content),
        h("div", { class: "tm-nav" }, TABS.map((name) => h("span", { class: `tm-tab ${tabs.includes(name) ? "is-lit" : ""}` }, icon(name)))));
}

const mocks = {
    today: () => phone(["home"],
        h("strong", { class: "tm-title" }, t("tab.home")),
        h("div", { class: "tm-hero" }, h("b", {}, t("words.count", { count: 10 })), line("55%", "is-light"), h("span", { class: "tm-pill is-lit" }, icon("play"))),
        h("div", { class: "tm-card tm-row" }, h("span", { class: "tm-ring" }), h("span", { class: "tm-lines" }, line("70%"), line("45%")))),
    cards: () => phone([],
        h("div", { class: "tm-card tm-flash" }, h("b", {}, "hello"), line("40%")),
        h("div", { class: "tm-grades" }, ["again", "hard", "good", "easy"].map((grade) => h("span", { class: `tm-grade tm-grade-${grade} ${grade === "good" ? "is-lit" : ""}` })))),
    topics: () => phone(["dictionaries"],
        h("strong", { class: "tm-title" }, t("tab.dictionaries")),
        ["👋", "🍎", "✈️"].map((emoji, i) => h("div", { class: "tm-card tm-row", style: { "--i": i } }, h("span", { class: "tm-emoji" }, art(emoji)), h("span", { class: "tm-lines" }, line(`${70 - i * 10}%`), line("35%")))),
        h("span", { class: "tm-add is-lit" }, icon("plus"))),
    path: () => phone(["cards", "tests"],
        h("div", { class: "tm-path" }, [0, 1, 2, 3].map((i) => h("span", { class: `tm-node ${i === 0 ? "is-done" : i === 1 ? "is-lit" : ""}`, style: { "--i": i } }, i === 0 ? icon("check") : i === 1 ? icon("play") : null)))),
    cloud: () => phone(["profile"],
        h("div", { class: "tm-cloud" }, icon("cloud")),
        h("div", { class: "tm-card tm-row" }, h("span", { class: "tm-dot is-lit" }, icon("share")), h("span", { class: "tm-lines" }, line("60%"), line("40%")))),
};
const SLIDES = Object.keys(mocks);

// Real names of the tabs go into the texts, so the guide changes with the app.
const names = () => Object.fromEntries(TABS.map((name) => [name, t(`tab.${name}`)]));

export function showTour() {
    const auto = !calmMotion();
    let index = 0;
    let paused = false;
    let manual = false; // "back" stops the automatic move: the person wants to read
    let press = null;

    const keys = (event) => {
        if (event.key === "ArrowRight") go(1);
        else if (event.key === "ArrowLeft") go(-1);
        else if (event.key === "Escape") { event.preventDefault(); close(); }
    };
    const screen = openFullscreen(t("tour.label"), keys, close);
    screen.body.classList.add("tour");

    function close() {
        document.removeEventListener("visibilitychange", onVisibility);
        screen.close();
    }
    function go(step) {
        if (step < 0) manual = true;
        const next = index + step;
        if (next < 0 || next >= SLIDES.length) return;
        index = next;
        draw();
    }
    function setPaused(value) {
        paused = value;
        screen.body.classList.toggle("is-paused", paused);
    }
    const onVisibility = () => setPaused(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);

    // Gestures: tap right / left, hold to pause, swipe down to close.
    screen.body.addEventListener("pointerdown", (event) => {
        if (event.target.closest("button")) return;
        const timer = setTimeout(() => { if (press) { press.held = true; setPaused(true); } }, 220);
        press = { x: event.clientX, y: event.clientY, held: false, timer };
    });
    screen.body.addEventListener("pointerup", (event) => {
        const p = press;
        press = null;
        if (!p) return;
        clearTimeout(p.timer);
        if (p.held) return setPaused(false);
        const dx = event.clientX - p.x;
        const dy = event.clientY - p.y;
        if (dy > 70 && dy > Math.abs(dx)) return close();
        if (Math.abs(dx) > 12 || Math.abs(dy) > 12) return;
        const box = screen.body.getBoundingClientRect();
        go(event.clientX - box.left < box.width * 0.3 ? -1 : 1);
    });
    screen.body.addEventListener("pointercancel", () => {
        if (press?.held) setPaused(false);
        if (press) clearTimeout(press.timer);
        press = null;
    });

    function draw() {
        const id = SLIDES[index];
        const last = index === SLIDES.length - 1;
        const running = auto && !manual && !last;
        const bars = h("div", { class: "tour-bars", "aria-hidden": "true" }, SLIDES.map((_, i) => {
            const bar = h("i", { class: i < index ? "is-full" : i === index ? (running ? "is-running" : "is-full") : "" });
            if (i === index && running) bar.addEventListener("animationend", () => go(1));
            return h("span", { class: "tour-bar" }, bar);
        }));
        const title = h("h2", { class: "tour-title", tabindex: "-1" }, t(`tour.${id}.title`, names()));
        screen.draw(
            bars,
            h("div", { class: "tour-top" },
                h("span", { class: "visually-hidden", "aria-live": "polite" }, t("tour.progress", { n: index + 1, total: SLIDES.length })),
                h("button", { class: "tour-skip", type: "button", onClick: close }, t("tour.skip")),
                h("button", { class: "icon-btn", type: "button", "aria-label": t("common.close"), onClick: close }, icon("close"))),
            h("div", { class: "tour-slide" },
                h("div", { class: "tour-art" }, mocks[id]()),
                h("div", { class: "tour-text" }, title, h("p", { class: "tour-body" }, t(`tour.${id}.body`, names())))),
            h("div", { class: "session-footer" },
                h("button", { class: "btn btn-soft", type: "button", disabled: index === 0, onClick: () => go(-1) }, t("tour.back")),
                h("button", { class: "btn btn-primary", type: "button", onClick: last ? close : () => go(1) }, t(last ? "tour.finish" : "tour.next"))));
        title.focus({ preventScroll: true, focusVisible: false });
    }

    draw();
}
