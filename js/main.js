import { initViewport } from "./core/viewport.js";
import { startActivityTracker } from "./core/activity.js";
import { getLocale } from "./core/i18n.js";
import { getState, subscribe } from "./core/store.js";
import { initNavigation, navigate, refresh, getCurrentScreen } from "./ui/navigation.js";
import { playLoader } from "./ui/loader.js";
import { showOnboarding } from "./ui/onboarding.js";
import { renderHome } from "./screens/home.js";
import { renderDictionaries } from "./screens/dictionaries.js";
import { renderCards } from "./screens/cards.js";
import { renderTests } from "./screens/tests.js";
import { renderProfile } from "./screens/profile.js";

const applyLocale = () => { document.documentElement.lang = getLocale(); };

initViewport();
applyLocale();
initNavigation({
    home: renderHome,
    dictionaries: renderDictionaries,
    cards: () => renderCards(refresh),
    tests: renderTests,
    profile: renderProfile,
});
navigate("home");

subscribe((type) => {
    // The timer must not flip a flashcard back or close an open <select>.
    if (type === "time" && getCurrentScreen() !== "home") return;
    applyLocale();
    if (type === "reset") {
        navigate("home");
        showOnboarding();
    } else {
        refresh();
    }
});

playLoader().then(() => {
    document.body.classList.add("is-ready");
    startActivityTracker();
    if (!getState().username) showOnboarding();
});

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Mellow: service worker failed", error));
}
