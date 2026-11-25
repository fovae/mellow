// The splash: Mello sleeps, wakes up and greets.
import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { getState } from "../core/store.js";
import { calmMotion } from "../core/theme.js";
import { languageCode } from "../data/languages.js";
import { mascot } from "./mascot.js";

const SEEN_KEY = "mellow_loader_seen";
const hello = { en: "Hello!", es: "¡Hola!", fr: "Salut !", de: "Hallo!", it: "Ciao!", pt: "Olá!", ru: "Привет!" };

// The languages of the user first, then the rest.
function greetings() {
    const { settings } = getState();
    const codes = [navigator.language?.slice(0, 2), settings.language, languageCode(settings.target), ...Object.keys(hello)];
    return [...new Set(codes)].filter((code) => hello[code]).slice(0, 3).map((code) => hello[code]);
}

// Once per session: full on the first start, short later. A tap skips it.
export function playLoader() {
    const loader = document.getElementById("loader");
    if (sessionStorage.getItem(SEEN_KEY)) {
        loader.remove();
        return Promise.resolve();
    }
    sessionStorage.setItem(SEEN_KEY, "1");

    const isFull = !getState().username && !calmMotion();
    loader.querySelectorAll("[data-t]").forEach((el) => { el.textContent = t(el.dataset.t); });
    loader.classList.toggle("is-full", isFull);
    loader.querySelector(".loader-stage").append(
        h("div", { class: "loader-mello" }, mascot("sleepy"), mascot("happy")),
        ...(isFull ? greetings().map((text) => h("div", { class: "loader-hello", "aria-hidden": "true" }, text)) : []));

    return new Promise((resolve) => {
        const finish = () => {
            clearTimeout(timer);
            loader.classList.add("is-hidden");
            setTimeout(() => loader.remove(), 600);
            setTimeout(resolve, 320);
        };
        const timer = setTimeout(finish, isFull ? 5800 : 1900);
        loader.addEventListener("click", finish, { once: true });
    });
}
