import { initViewport } from "./core/viewport.js";
import { startActivityTracker } from "./core/activity.js";
import { getLocale } from "./core/i18n.js";
import { applyTheme } from "./core/theme.js";
import { libraryExamples, loadLibrary } from "./core/library.js";
import { showRewards } from "./ui/rewards.js";
import { fillExamples, onRewards, protectStreak, getScopeQueue, getState, subscribe } from "./core/store.js";
import { initNavigation, navigate, refresh } from "./ui/navigation.js";
import { playLoader } from "./ui/loader.js";
import { countAll, studyAll } from "./ui/actions.js";
import { openLibrary } from "./ui/library-modal.js";
import { continueCourse } from "./ui/profiles.js";
import { showOnboarding } from "./ui/onboarding.js";
import { autoSave, checkAccount, hasServer, isSignedIn, showAuthScreen } from "./ui/account.js";
import { renderHome } from "./screens/home.js";
import { renderDictionaries } from "./screens/dictionaries.js";
import { renderCards } from "./screens/cards.js";
import { renderTests } from "./screens/tests.js";
import { renderProfile } from "./screens/profile.js";

const applySettings = () => {
    document.documentElement.lang = getLocale();
    applyTheme();
};

onRewards(showRewards);
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
    // The timer must not redraw what the user is touching.
    if (type === "time") return;
    applySettings();
    if (type === "switch") return;
    if (type === "reset") {
        navigate("home");
        startFlow();
    } else if (type === "restore") {
        navigate("home");
        if (!getState().username) showOnboarding();
    } else {
        refresh();
    }
});

// Due words and the date may change while the app is in the background.
document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    protectStreak();
    autoSave();
    if (!document.activeElement?.matches("input, textarea")) refresh();
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

// The account is checked while Mello wakes up: the first screen offers to sign in when there is a server.
const accountChecked = checkAccount();

playLoader().then(async () => {
    document.body.classList.add("is-ready");
    startActivityTracker();
    // Loaded when idle: suggestions and the next topic need it.
    loadLibrary().then(() => {
        if (document.querySelector("dialog[open]") || document.activeElement?.matches("input, textarea")) return;
        fillExamples(libraryExamples);
        continueCourse();
        refresh();
    });
    protectStreak();
    // A slow network must not hold the app: without an answer it starts as without a server.
    await Promise.race([accountChecked, new Promise((resolve) => setTimeout(resolve, 4000))]);
    if (getState().username && (!hasServer() || isSignedIn())) return runShortcut();
    startFlow();
});

// An account comes first (when the server answers), then the first screen when this device has no profile yet.
async function startFlow() {
    if (hasServer() && !isSignedIn()) await showAuthScreen();
    if (!getState().username) showOnboarding();
}

// A session ends with its dialog; "close" does not bubble.
document.addEventListener("close", () => setTimeout(continueCourse), true);

// Shortcuts of the installed app (manifest.json).
function runShortcut() {
    const go = new URLSearchParams(location.search).get("go");
    if (!go) return;
    history.replaceState(null, "", location.pathname);
    if (go === "library") openLibrary();
    if (go === "review" && countAll()) studyAll();
}

if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("./sw.js").catch((error) => console.warn("Mellow: service worker failed", error));
}
