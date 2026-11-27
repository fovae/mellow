// The first screen after signing in: what to learn, where to start and the pace. Big blocks, not rows.
// The app language is chosen on the sign-in screen (it follows the system at first); the name is the nickname.
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { LIBRARY_LANGUAGES } from "../core/library.js";
import { getState, setUsername, subscribe, switchProfile, updateSettings } from "../core/store.js";
import { languageCode, languageFlag, languageName } from "../data/languages.js";
import { art } from "./art.js";
import { icon } from "./icons.js";
import { mascot } from "./mascot.js";
import { openFullscreen, openModal } from "./modal.js";
import { goalFor, isPreset, openPaceSheet, paceForecast, paceLabel, PRESETS } from "./pace.js";
import { addFirstTopics } from "./profiles.js";
import { hasCloudCopy, isSignedIn, loadFromCloud, nickname, saveToCloud } from "./account.js";
import { showTour } from "./tour.js";

const guests = ["Mystic Leaf", "Happy Pebble", "Silver Fox", "Cloud Jumper", "Little Fern",
    "Blue Owl", "Calm River", "Sunny Ray", "Night Owl", "Forest Friend"];
const LEVELS = [{ id: "zero", art: "📚" }, { id: "basics", art: "🎓" }];

let shown = false;

export function showOnboarding() {
    if (shown) return;
    shown = true;
    const isNew = !getState().dictionaries.length;
    const native = LIBRARY_LANGUAGES.find((name) => navigator.language?.startsWith(languageCode(name))) ?? "English";
    const draft = { from: native, to: native === "English" ? "Spanish" : "English", level: "zero", pace: { count: 10, unit: "day" } };
    // There is nothing behind this screen yet, so Escape does not close it.
    const screen = openFullscreen(t("onboarding.title"), (event) => event.key === "Escape" && event.preventDefault(), () => {});
    const unsubscribe = subscribe((type) => {
        if (type === "restore") finish();
        else if (type === "settings") draw();
    });
    // Mello and the title stay; only the blocks are drawn again, so Mello keeps floating.
    const hello = mascot("happy", "mascot-large mascot-watch");
    const blocks = h("div", { class: "setup-blocks" });
    const title = h("h1", { class: "screen-title", tabindex: "-1" }, t("onboarding.title"));
    const intro = h("p", { class: "muted" });
    const page = h("form", { class: "setup", id: "setup", onSubmit: (event) => { event.preventDefault(); save(); } },
        h("header", { class: "setup-head" }, hello, title, intro), blocks);
    const start = h("button", { class: "btn btn-primary", type: "submit", form: "setup" });

    function finish() {
        shown = false;
        unsubscribe();
        screen.close();
    }

    function save() {
        const { from, to, level, pace } = draft;
        finish();
        if (isNew) {
            updateSettings({ newPerDay: pace.count, paceUnit: pace.unit, dailyGoal: goalFor(pace) }, "switch");
            switchProfile({ from, to });
        }
        setUsername(nickname() || guests[Math.floor(Math.random() * guests.length)]);
        // The new profile with its first topics goes to the cloud at once, not in a week.
        (isNew ? addFirstTopics({ from, to }, { knowsBasics: level === "basics" }) : Promise.resolve()).then(() => isSignedIn() && saveToCloud({ quiet: true }));
        // Then the guide: where things are in Mellow.
        setTimeout(showTour, 400);
    }

    // Mello is only there to watch: a small hop at every choice.
    function cheer() {
        hello.classList.remove("is-cheering");
        void hello.offsetWidth;
        hello.classList.add("is-cheering");
    }
    const change = (fn) => () => { fn(); cheer(); draw(); };
    let spin = false; // the arrow turns once after a swap

    const block = (title, ...content) => h("section", { class: "setup-block" }, h("h2", { class: "setup-block-title" }, title), ...content);

    // A tile: a picture, a big line and a small one. Pressed = chosen.
    const tile = ({ picture, main, sub, active, onClick, className = "", label }) => h("button", {
        class: `setup-tile ${active ? "is-active" : ""} ${className}`, type: "button", "aria-pressed": active === undefined ? null : String(active),
        "aria-label": label ?? null, onClick,
    }, picture && h("span", { class: "setup-tile-art", "aria-hidden": "true" }, picture), h("strong", { class: "setup-tile-main" }, main), sub && h("small", { class: "setup-tile-sub" }, sub));

    // Languages: "I speak" and "I learn" side by side; the arrow between them swaps them.
    function pickLanguage(key, other) {
        openModal({
            title: t(key === "from" ? "library.native" : "library.target"),
            build: (close) => h("div", { class: "lang-grid", role: "listbox" }, LIBRARY_LANGUAGES.map((name) => {
                const isActive = name === draft[key];
                return h("button", {
                    class: `lang-option ${isActive ? "is-active" : ""}`, type: "button", role: "option", "aria-selected": String(isActive), "data-value": name,
                    onClick: () => {
                        close();
                        if (isActive) return;
                        // The two languages never match: picking the other one swaps them.
                        if (name === draft[other]) draft[other] = draft[key];
                        draft[key] = name;
                        cheer();
                        draw();
                    },
                }, h("span", { class: "lang-option-art", "aria-hidden": "true" }, art(languageFlag(name))), languageName(name, getLocale()));
            })),
        });
    }
    const languageTile = (key, other) => tile({
        className: "lang-tile", picture: art(languageFlag(draft[key])), main: languageName(draft[key], getLocale()),
        sub: t(key === "from" ? "onboarding.speak" : "onboarding.learn"),
        label: `${t(key === "from" ? "library.native" : "library.target")}: ${languageName(draft[key], getLocale())}`,
        onClick: () => pickLanguage(key, other),
    });
    const languages = () => block(t("onboarding.languages"),
        h("div", { class: "lang-pair" },
            languageTile("from", "to"),
            h("button", {
                class: "lang-swap", type: "button", "aria-label": t("onboarding.swap"),
                onClick: change(() => { [draft.from, draft.to] = [draft.to, draft.from]; spin = true; }),
            }, h("span", { class: `lang-swap-arrow ${spin ? "is-spinning" : ""}` }, icon("swap"))),
            languageTile("to", "from")));

    // Where to start: from zero, or past the first topics (they stay in Topics).
    const level = () => block(t("onboarding.level"),
        h("div", { class: "tile-row" }, LEVELS.map(({ id, art: picture }) => tile({
            picture: art(picture), main: t(`onboarding.level.${id}`), active: draft.level === id, onClick: change(() => { draft.level = id; }),
        }))),
        h("p", { class: "setup-note" }, t(`onboarding.level.${draft.level}Note`)));

    // The pace: three ready ones and an own one; the forecast follows.
    const pace = () => {
        const custom = !isPreset(draft.pace);
        return block(t("onboarding.pace"),
            h("div", { class: "tile-row tile-row-3" }, PRESETS.map(({ count, art: picture }) => tile({
                picture: art(picture), main: String(count), sub: t("pace.unit.day"),
                active: !custom && draft.pace.count === count, onClick: change(() => { draft.pace = { count, unit: "day" }; }),
            }))),
            tile({
                className: "setup-tile-wide", picture: art("✏️"), main: custom ? paceLabel(draft.pace) : t("pace.custom"),
                sub: custom ? t("pace.change") : t("pace.customHint"), active: custom,
                onClick: () => openPaceSheet(draft.pace, (value) => { draft.pace = value; cheer(); draw(); }),
            }),
            h("p", { class: "setup-note", role: "status" }, paceForecast(draft.pace)));
    };

    function draw() {
        const name = nickname();
        title.textContent = name ? t("onboarding.hello", { name }) : t("onboarding.title");
        intro.textContent = t(isNew ? "onboarding.intro" : "onboarding.introBack");
        start.textContent = t("common.start");
        blocks.replaceChildren(...[
            isNew && languages(),
            isNew && level(),
            isNew && pace(),
            hasCloudCopy() && h("button", { class: "btn btn-soft", type: "button", onClick: loadFromCloud }, icon("cloud"), t("account.load")),
        ].filter(Boolean));
        spin = false;
    }

    draw();
    screen.draw(page, h("div", { class: "session-footer" }, start));
    title.focus({ preventScroll: true, focusVisible: false });
}