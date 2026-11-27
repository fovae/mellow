// The same as APP_VERSION (js/core/version.js; a test checks it). A new number makes this file new,
// so browsers see the update and the app offers to reload (js/ui/update.js).
const VERSION = "0.23.0";
const CACHE = `mellow-${VERSION}`;
const ASSETS = [
    "./",
    "./css/art.css",
    "./css/base.css",
    "./css/cells.css",
    "./css/components.css",
    "./css/layout.css",
    "./css/legal.css",
    "./css/loader.css",
    "./css/play.css",
    "./css/setup.css",
    "./css/themes.css",
    "./css/tour.css",
    "./css/widgets.css",
    "./fonts/manrope-cyrillic-ext.woff2",
    "./fonts/manrope-cyrillic.woff2",
    "./fonts/manrope-latin-ext.woff2",
    "./fonts/manrope-latin.woff2",
    "./img/icons/16.png",
    "./img/icons/180.png",
    "./img/icons/192.png",
    "./img/icons/32.png",
    "./img/icons/48.png",
    "./img/icons/512.png",
    "./img/icons/maskable.png",
    "./index.html",
    "./js/boot.js",
    "./js/core/accents.js",
    "./js/core/account.js",
    "./js/core/achievements.js",
    "./js/core/activity.js",
    "./js/core/advice.js",
    "./js/core/dates.js",
    "./js/core/dom.js",
    "./js/core/games.js",
    "./js/core/i18n.js",
    "./js/core/lessons.js",
    "./js/core/library.js",
    "./js/core/profiles.js",
    "./js/core/quiz.js",
    "./js/core/rewards.js",
    "./js/core/sound.js",
    "./js/core/speech.js",
    "./js/core/srs.js",
    "./js/core/store.js",
    "./js/core/theme.js",
    "./js/core/transfer.js",
    "./js/core/version.js",
    "./js/core/viewport.js",
    "./js/data/languages.js",
    "./js/data/library.js",
    "./js/i18n/en.js",
    "./js/i18n/ru.js",
    "./js/main.js",
    "./js/screens/cards.js",
    "./js/screens/dictionaries.js",
    "./js/screens/home.js",
    "./js/screens/profile.js",
    "./js/screens/tests.js",
    "./js/ui/account.js",
    "./js/ui/actions.js",
    "./js/ui/art.js",
    "./js/ui/cells.js",
    "./js/ui/dictionary-modals.js",
    "./js/ui/dropdown.js",
    "./js/ui/exercises.js",
    "./js/ui/games.js",
    "./js/ui/hero.js",
    "./js/ui/icons.js",
    "./js/ui/lesson.js",
    "./js/ui/library-modal.js",
    "./js/ui/loader.js",
    "./js/ui/mascot.js",
    "./js/ui/modal.js",
    "./js/ui/navigation.js",
    "./js/ui/onboarding.js",
    "./js/ui/pace.js",
    "./js/ui/parts.js",
    "./js/ui/path.js",
    "./js/ui/profiles.js",
    "./js/ui/rewards.js",
    "./js/ui/scrollbar.js",
    "./js/ui/stats.js",
    "./js/ui/study.js",
    "./js/ui/test-session.js",
    "./js/ui/toast.js",
    "./js/ui/tour.js",
    "./js/ui/update.js",
    "./js/ui/transfer-modals.js",
    "./js/ui/widgets.js",
    "./manifest.json",
    "./privacy.html",
    "./terms.html",
];

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
});

// A new version waits until the person taps "Update" (js/ui/update.js); the very first one starts at once.
self.addEventListener("message", (event) => {
    if (event.data === "skip-waiting") self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil((async () => {
        // Only our own caches: other apps may share this origin.
        const names = await caches.keys();
        await Promise.all(names.filter((n) => n.startsWith("mellow-") && n !== CACHE).map((n) => caches.delete(n)));
        await self.clients.claim();
    })());
});

// Network first, cache as the offline fallback. Other origins are left to the browser.
self.addEventListener("fetch", (event) => {
    const { request } = event;
    const url = new URL(request.url);
    // The account API is never cached: it is private and must be fresh.
    if (request.method !== "GET" || url.origin !== location.origin || url.pathname.startsWith("/api/")) return;

    event.respondWith((async () => {
        try {
            const response = await fetch(request);
            if (response.ok) {
                const copy = response.clone();
                event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
            }
            return response;
        } catch {
            const cache = await caches.open(CACHE);
            const cached = await cache.match(request);
            if (cached) return cached;
            return request.mode === "navigate" ? cache.match("./index.html") : Response.error();
        }
    })());
});
