import { initViewport } from "./core/viewport.js";
import { startActivityTracker } from "./core/activity.js";
import { getLocale } from "./core/i18n.js";
import { applyTheme } from "./core/theme.js";
import { libraryExamples, loadLibrary } from "./core/library.js";
import { fillExamples, getScopeQueue, getState, subscribe } from "./core/store.js";
import { initNavigation, navigate, refresh, getCurrentScreen } from "./ui/navigation.js";
import { playLoader } from "./ui/loader.js";
import { showOnboarding } from "./ui/onboarding.js";
import { renderHome } from "./screens/home.js";
import { renderDictionaries } from "./screens/dictionaries.js";
import { renderCards } from "./screens/cards.js";
import { renderTests } from "./screens/tests.js";
import { renderProfile } from "./screens/profile.js";

const applySettings = () => {
    document.documentElement.lang = getLocale();
    applyTheme();
};

initViewport();
applySettings();
initNavigation({
    home: renderHome,
    dictionaries: renderDictionaries,
    cards: renderCards,
    tests: renderTests,
    profile: renderProfile,
});
navigate("home");

subscribe((type) => {
    // The timer must not close an open <select>.
    if (type === "time" && getCurrentScreen() !== "home") return;
    applySettings();
    if (type === "reset") {
        navigate("home");
        showOnboarding();
    } else if (type === "restore") {
        navigate("home");
        if (!getState().username) showOnboarding();
    } else {
        refresh();
    }
});

// Due words and the date may change while the app is in the background.
document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !document.activeElement?.matches("select, input")) refresh();
});

// The number on the icon of the installed app, where supported.
const updateBadge = () => {
    const { due } = getScopeQueue(null);
    (due.length ? navigator.setAppBadge?.(due.length) : navigator.clearAppBadge?.())?.catch(() => {});
};
updateBadge();
subscribe(updateBadge);

// Ask the browser not to clear the data when space is low.
navigator.storage?.persist?.().catch(() => {});

playLoader().then(() => {
    document.body.classList.add("is-ready");
    startActivityTracker();
    // Loaded when idle: suggestions and the next topic need it.
    loadLibrary().then(() => {
        if (document.querySelector("dialog[open]") || document.activeElement?.matches("select, input")) return;
        fillExamples(libraryExamples);
        refresh();
    });
    if (!getState().username) showOnboarding();
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Mellow: service worker failed", error));
}
