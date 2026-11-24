import { h } from "../core/dom.js";
import { t, languages, formatTime } from "../core/i18n.js";
import { getState, getTotals, setLanguage, setUsername, resetAll } from "../core/store.js";
import { screenHeader } from "../ui/navigation.js";
import { openModal, confirmModal, form, field, requireValue } from "../ui/modal.js";

const line = (label, value) => h("div", { class: "row" }, h("span", { class: "row-main" }, label), value);

function editName() {
    const input = h("input", { class: "input", value: getState().username, maxlength: 30, autocomplete: "given-name" });
    openModal({
        title: t("profile.name"),
        build: (close) => form({
            onCancel: close,
            onSubmit: () => { if (requireValue(input)) { close(); setUsername(input.value.trim()); } },
        }, field(t("profile.name"), input)),
    });
}

export function renderProfile() {
    const { username, settings } = getState();
    const totals = getTotals();
    const language = h("select", { class: "input input-inline", "aria-label": t("profile.language"), onChange: (event) => setLanguage(event.target.value) },
        languages.map(({ code, name }) => h("option", { value: code, selected: code === settings.language }, name)));

    return [
        screenHeader(t("profile.title"), t("profile.subtitle")),
        h("div", { class: "card" },
            h("h2", { class: "section-title" }, t("profile.stats")),
            line(t("profile.learned"), h("strong", {}, `${totals.learned} / ${totals.words}`)),
            line(t("home.favourites"), h("strong", {}, String(totals.favourites))),
            line(t("home.time"), h("strong", {}, formatTime(totals.seconds)))),
        h("div", { class: "card" },
            h("h2", { class: "section-title" }, t("profile.settings")),
            line(t("profile.name"), h("button", { class: "btn btn-soft", type: "button", onClick: editName }, username)),
            line(t("profile.language"), language)),
        h("div", { class: "card" },
            h("h2", { class: "section-title" }, t("profile.data")),
            h("button", {
                class: "btn btn-danger btn-wide", type: "button",
                onClick: () => confirmModal({ title: t("profile.resetTitle"), text: t("profile.resetText"), action: t("common.delete"), onConfirm: resetAll }),
            }, t("profile.reset"))),
    ];
}
