import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { setUsername } from "../core/store.js";
import { openModal, requireValue } from "./modal.js";

const guests = ["Mystic Leaf", "Happy Pebble", "Silver Fox", "Cloud Jumper", "Little Fern",
    "Blue Owl", "Calm River", "Sunny Ray", "Night Owl", "Forest Friend"];

export function showOnboarding() {
    const input = h("input", { class: "input", placeholder: t("onboarding.placeholder"), "aria-label": t("onboarding.placeholder"), autocomplete: "given-name", maxlength: 30, autofocus: true });
    openModal({
        title: t("onboarding.title"),
        dismissible: false,
        build: (close) => {
            const save = (name) => { close(); setUsername(name); };
            return h("form", { class: "form", onSubmit: (event) => { event.preventDefault(); if (requireValue(input)) save(input.value.trim()); } },
                h("p", { class: "muted" }, t("onboarding.text")),
                input,
                h("div", { class: "actions" },
                    h("button", { class: "btn btn-soft", type: "button", onClick: () => save(guests[Math.floor(Math.random() * guests.length)]) }, t("common.skip")),
                    h("button", { class: "btn btn-primary", type: "submit" }, t("common.save"))));
        },
    });
}
