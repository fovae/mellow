import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { LIBRARY_LANGUAGES } from "../core/library.js";
import { getState, setUsername, switchProfile } from "../core/store.js";
import { languageCode } from "../data/languages.js";
import { mascot } from "./mascot.js";
import { openModal, field, requireValue } from "./modal.js";
import { languageSelect } from "./library-modal.js";
import { addFirstTopics } from "./profiles.js";

const guests = ["Mystic Leaf", "Happy Pebble", "Silver Fox", "Cloud Jumper", "Little Fern",
    "Blue Owl", "Calm River", "Sunny Ray", "Night Owl", "Forest Friend"];

export function showOnboarding() {
    const isNew = !getState().dictionaries.length;
    const native = LIBRARY_LANGUAGES.find((name) => navigator.language?.startsWith(languageCode(name))) ?? "English";
    const input = h("input", { class: "input", placeholder: t("onboarding.placeholder"), autocomplete: "given-name", maxlength: 30 });
    const from = languageSelect(t("library.native"), native);
    const to = languageSelect(t("library.target"), native === "English" ? "Spanish" : "English");
    const error = h("p", { class: "feedback is-wrong", role: "status" });

    openModal({
        title: t("onboarding.title"),
        dismissible: false,
        build: (close) => {
            const save = (name) => {
                error.textContent = isNew && from.value === to.value ? t("onboarding.same") : "";
                if (error.textContent) return;
                close();
                if (isNew) switchProfile({ from: from.value, to: to.value });
                setUsername(name);
                if (isNew) addFirstTopics({ from: from.value, to: to.value });
            };
            return h("form", { class: "form", onSubmit: (event) => { event.preventDefault(); if (requireValue(input)) save(input.value.trim()); } },
                h("div", { class: "welcome" }, mascot("happy", "mascot-large")),
                field(t("onboarding.text"), input),
                ...(isNew ? [
                    h("div", { class: "field-pair" }, field(t("library.native"), from), field(t("library.target"), to)),
                    h("p", { class: "muted" }, t("onboarding.auto"))] : []),
                error,
                h("div", { class: "actions" },
                    h("button", { class: "btn btn-soft", type: "button", onClick: () => save(guests[Math.floor(Math.random() * guests.length)]) }, t("common.skip")),
                    h("button", { class: "btn btn-primary", type: "submit" }, t("common.start"))));
        },
    });
}
