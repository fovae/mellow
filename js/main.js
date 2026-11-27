import { initViewport } from "./core/viewport.js";
import { startActivityTracker } from "./core/activity.js";
import { getLocale } from "./core/i18n.js";
import { applyTheme } from "./core/theme.js";
import { libraryExamples, loadLibrary } from "./core/library.js";
import { showRewards } from "./ui/rewards.js";
import { fillExamples, onRewards, protectStreak, getScopeQueue, getState, subscribe } from "./core/store.js";
import { initNavigation, markStale, navigate, prepareScreens, refresh } from "./ui/navigation.js";
import { playLoader } from "./ui/loader.js";
import { countAll, studyAll } from "./ui/actions.js";
import { openLibrary } from "./ui/library-modal.js";
import { continueCourse } from "./ui/profiles.js";
import { showOnboarding } from "./ui/onboarding.js";
import { initUpdates } from "./ui/update.js";
import { accountGate, autoSave, checkAccount } from "./ui/account.js";
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
navigate("home", { now: true });

subscribe((type) => {
    // The timer must not redraw what the user is touching.
    if (type === "time") return markStale();
    applySettings();
    if (type === "switch") return;
    if (type === "reset") {
        navigate("home", { now: true });
        startFlow();
    } else if (type === "restore") {
        navigate("home", { now: true });
        // During the start flow the next screen comes from startFlow itself.
        if (!inFlow && !getState().username) showOnboarding();
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

// The account is checked while Mello wakes up.
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
    // Without an answer in 10 s the check counts as offline (js/ui/account.js).
    await accountChecked;
    prepareScreens();
    await startFlow();
    if (getState().username) runShortcut();
});

// The order of a first start: the splash, the account, languages and pace, the guide (after the first screen), home.
let inFlow = false;
async function startFlow() {
    if (inFlow) return;
    inFlow = true;
    try {
        await accountGate();
        if (!getState().username) showOnboarding();
    } finally {
        inFlow = false;
    }
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

initUpdates();
