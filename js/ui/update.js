// App updates, as in Training: a new version waits until the person taps "Update".
// The service worker (sw.js) is checked at start, when the app comes back to the screen and once an hour.
// The offer never interrupts a lesson or a sheet: it waits until nothing is open.
import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { openModal } from "./modal.js";
import { toast } from "./toast.js";

let registration = null;
let waiting = null; // the new version, installed and waiting
let shown = false;

const isOpen = () => Boolean(document.querySelector("dialog[open]"));

function offer(worker) {
    // No controller: the very first install, nothing to update.
    if (!worker || !navigator.serviceWorker.controller) return;
    waiting = worker;
    showWhenFree();
}

function showWhenFree() {
    if (!waiting || shown) return;
    if (isOpen()) return; // tried again when a dialog closes (see initUpdates)
    shown = true;
    openModal({
        title: t("update.title"),
        emoji: "🚀",
        build: (close) => [
            h("p", { class: "muted" }, t("update.text")),
            h("div", { class: "actions" },
                h("button", { class: "btn btn-soft", type: "button", onClick: close }, t("update.later")),
                h("button", { class: "btn btn-primary", type: "button", onClick: (event) => { event.currentTarget.disabled = true; applyUpdate(); } }, t("update.now"))),
        ],
    });
}

// The waiting version takes over; "controllerchange" then reloads the page. A reload anyway if it is slow.
export function applyUpdate() {
    if (!waiting) return location.reload();
    waiting.postMessage("skip-waiting");
    setTimeout(() => location.reload(), 3000);
}

// For "Version" in the profile: looks for a new version now.
export async function checkForUpdate() {
    if (!registration) return toast("✨", t("update.latest"));
    try {
        await registration.update();
    } catch {
        return toast("❓", t("account.error.offline"));
    }
    // An installing version reports itself through "updatefound"; give it a moment.
    setTimeout(() => {
        if (registration.waiting) {
            shown = false;
            offer(registration.waiting);
        } else if (!registration.installing) {
            toast("✨", t("update.latest"));
        }
    }, 1200);
}

export function initUpdates() {
    if (!("serviceWorker" in navigator)) return;
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
        if (reloading || !waiting) return;
        reloading = true;
        location.reload();
    });
    // A dialog closed: maybe now is the moment.
    document.addEventListener("close", () => setTimeout(showWhenFree, 400), true);

    navigator.serviceWorker.register("./sw.js").then((reg) => {
        registration = reg;
        if (reg.waiting) offer(reg.waiting);
        reg.addEventListener("updatefound", () => {
            const worker = reg.installing;
            worker?.addEventListener("statechange", () => worker.state === "installed" && offer(worker));
        });
        const check = () => navigator.onLine && reg.update().catch(() => {});
        document.addEventListener("visibilitychange", () => !document.hidden && check());
        setInterval(check, 60 * 60 * 1000);
    }).catch((error) => console.warn("Mellow: service worker failed", error));
}
