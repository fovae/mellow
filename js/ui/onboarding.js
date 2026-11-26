// The first screen: name, languages and pace on one page.
import { h } from "../core/dom.js";
import { t, getLocale, languages } from "../core/i18n.js";
import { LIBRARY_LANGUAGES } from "../core/library.js";
import { getState, setUsername, subscribe, switchProfile, updateSettings } from "../core/store.js";
import { languageCode, languageFlag, languageName } from "../data/languages.js";
import { cell, choiceCell, group } from "./cells.js";
import { mascot } from "./mascot.js";
import { openFullscreen } from "./modal.js";
import { addFirstTopics } from "./profiles.js";
import { restoreBackup } from "./transfer-modals.js";
import { isSignedIn, saveToCloud } from "./account.js";

const guests = ["Mystic Leaf", "Happy Pebble", "Silver Fox", "Cloud Jumper", "Little Fern",
    "Blue Owl", "Calm River", "Sunny Ray", "Night Owl", "Forest Friend"];
const paces = {
    calm: { newPerDay: 5, dailyGoal: 10 },
    steady: { newPerDay: 10, dailyGoal: 20 },
    fast: { newPerDay: 20, dailyGoal: 30 },
};

let shown = false;

export function showOnboarding() {
    if (shown) return;
    shown = true;
    const isNew = !getState().dictionaries.length;
    const native = LIBRARY_LANGUAGES.find((name) => navigator.language?.startsWith(languageCode(name))) ?? "English";
    const draft = { name: "", from: native, to: native === "English" ? "Spanish" : "English", pace: "steady" };
    // There is nothing behind this screen yet, so Escape does not close it.
    const screen = openFullscreen(t("onboarding.title"), (event) => event.key === "Escape" && event.preventDefault(), () => {});
    const unsubscribe = subscribe((type) => {
        if (type === "restore") finish();
        else if (type === "settings") draw();
    });

    function finish() {
        shown = false;
        unsubscribe();
        screen.close();
    }

    function save() {
        const { name, from, to, pace } = draft;
        finish();
        if (isNew) {
            updateSettings(paces[pace], "switch");
            switchProfile({ from, to });
        }
        setUsername(name.trim() || guests[Math.floor(Math.random() * guests.length)]);
        // The new profile with its first topics goes to the cloud at once, not in a week.
        (isNew ? addFirstTopics({ from, to }) : Promise.resolve()).then(() => isSignedIn() && saveToCloud({ quiet: true }));
    }

    // The two languages never match: picking the other one swaps them.
    const languageRow = (key, other, label) => choiceCell({
        label, emoji: languageFlag(draft[key]), value: draft[key],
        options: LIBRARY_LANGUAGES.map((name) => ({ value: name, name: languageName(name, getLocale()), emoji: languageFlag(name) })),
        onPick: (value) => {
            if (value === draft[other]) draft[other] = draft[key];
            draft[key] = value;
            draw();
        },
    });

    const paceControl = () => {
        const segments = Object.keys(paces).map((pace) => h("button", {
            class: `segment ${pace === draft.pace ? "is-active" : ""}`, type: "button", "aria-pressed": String(pace === draft.pace), "data-value": pace,
            onClick: () => {
                draft.pace = pace;
                segments.forEach((el) => {
                    const isActive = el.dataset.value === pace;
                    el.classList.toggle("is-active", isActive);
                    el.setAttribute("aria-pressed", String(isActive));
                });
                note.textContent = paceText();
            },
        }, t(`onboarding.${pace}`)));
        const paceText = () => t("onboarding.paceText", { words: paces[draft.pace].newPerDay, answers: paces[draft.pace].dailyGoal });
        const note = h("small", { class: "cell-sub", role: "status" }, paceText());
        return cell({ icon: "target", tint: 3, label: t("onboarding.pace"), sub: note, tall: true, control: h("div", { class: "segmented" }, segments) });
    };

    function draw() {
        const scrollTop = screen.body.querySelector(".setup")?.scrollTop ?? 0;
        const name = h("input", {
            class: "input setup-name", placeholder: t("onboarding.placeholder"), "aria-label": t("onboarding.text"),
            autocomplete: "off", maxlength: 30, value: draft.name, onInput: () => { draft.name = name.value; },
        });
        const locale = getLocale();
        const title = h("h1", { class: "screen-title", tabindex: "-1" }, t("onboarding.title"));
        const page = h("form", { class: "setup", id: "setup", onSubmit: (event) => { event.preventDefault(); save(); } },
            h("header", { class: "setup-head" }, mascot("happy", "mascot-large"), title, h("p", { class: "muted" }, t("onboarding.intro"))),
            group(t("onboarding.text"), [h("div", { class: "cell" }, name)], { foot: t("onboarding.nameNote") }),
            isNew && group(t("onboarding.languages"), [
                languageRow("to", "from", t("library.target")),
                languageRow("from", "to", t("library.native")),
                paceControl(),
            ], { foot: t("onboarding.auto") }),
            group(t("onboarding.app"), [
                choiceCell({
                    icon: "text", tint: 4, label: t("profile.language"), value: locale,
                    options: languages.map((l) => ({ value: l.code, name: l.name })),
                    onPick: (language) => updateSettings({ language }),
                }),
                cell({ icon: "download", tint: 5, label: t("settings.restore"), sub: t("onboarding.restoreNote"), onClick: restoreBackup }),
            ], { foot: t("onboarding.private") }));
        screen.draw(page, h("div", { class: "session-footer" }, h("button", { class: "btn btn-primary", type: "submit", form: "setup" }, t("common.start"))));
        page.scrollTop = scrollTop;
        // Not the name field: the keyboard must not open by itself. Focus stays on the screen after a redraw.
        if (!scrollTop || !screen.body.contains(document.activeElement)) title.focus({ preventScroll: true, focusVisible: false });
    }

    draw();
}
