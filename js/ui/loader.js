import { t } from "../core/i18n.js";

const SEEN_KEY = "mellow_loader_seen";

// Full splash once per session; later reloads skip straight to the app.
export function playLoader() {
    const loader = document.getElementById("loader");
    loader.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });

    if (sessionStorage.getItem(SEEN_KEY)) {
        loader.remove();
        return Promise.resolve();
    }
    sessionStorage.setItem(SEEN_KEY, "1");

    return new Promise((resolve) => setTimeout(() => {
        loader.classList.add("is-hidden");
        setTimeout(() => loader.remove(), 800);
        setTimeout(resolve, 420);
    }, 2300));
}
