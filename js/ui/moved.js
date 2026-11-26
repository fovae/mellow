// The old address (GitHub Pages) only tells people where Mellow lives now.
// Data in the browser belongs to an address, so the words travel as a backup file.
import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { getState } from "../core/store.js";
import { openFullscreen } from "./modal.js";
import { mascot } from "./mascot.js";
import { saveBackup } from "./transfer-modals.js";

export const NEW_HOME = "https://mellow.fovae.workers.dev/";
export const isOldHome = () => location.hostname === "fovae.github.io";

export function showMoved() {
    const hasWords = getState().dictionaries.some((d) => d.words.length);
    // Nothing behind this screen: Escape does not close it.
    const screen = openFullscreen(t("moved.title"), (event) => event.key === "Escape" && event.preventDefault(), () => {});
    screen.draw(
        h("div", { class: "setup" },
            h("header", { class: "setup-head" },
                mascot("happy", "mascot-large"),
                h("h1", { class: "screen-title" }, t("moved.title")),
                h("p", { class: "muted" }, t(hasWords ? "moved.textWords" : "moved.text")),
                h("p", { class: "moved-address" }, NEW_HOME.replace(/^https:\/\/|\/$/g, "")))),
        h("div", { class: "session-footer moved-actions" },
            hasWords && h("button", { class: "btn btn-soft", type: "button", onClick: saveBackup }, t("moved.save")),
            h("a", { class: "btn btn-primary", href: NEW_HOME, rel: "noopener" }, t("moved.open"))));
}
