import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import * as store from "../core/store.js";
import { studyLanguages, dictionaryIcons } from "../data/languages.js";
import { openModal, confirmModal, form, field, requireValue } from "./modal.js";
import { icon } from "./icons.js";

const textInput = (value = "", placeholder = "", maxlength = 80) =>
    h("input", { class: "input", value, placeholder, maxlength, autocomplete: "off" });

function iconPicker(initial) {
    let selected = initial;
    const el = h("div", { class: "icon-grid" });
    const draw = () => el.replaceChildren(...dictionaryIcons.map((emoji) => h("button", {
        class: `icon-choice ${emoji === selected ? "is-active" : ""}`, type: "button", "aria-pressed": String(emoji === selected),
        onClick: () => { selected = emoji; draw(); },
    }, emoji)));
    draw();
    return { el, get: () => selected, set: (emoji) => { selected = emoji; draw(); } };
}

// Create (no dict) and edit (dict) share one form.
export function openDictionaryForm(dict) {
    const name = textInput(dict?.name, t("dict.namePlaceholder"));
    const description = textInput(dict?.description, t("dict.descriptionPlaceholder"), 140);
    const picker = iconPicker(dict?.emoji ?? studyLanguages.Spanish);
    const select = (value) => h("select", { class: "input" },
        Object.keys(studyLanguages).map((lang) => h("option", { value: lang, selected: lang === value }, lang)));
    const from = select(dict?.from ?? "English");
    const to = select(dict?.to ?? "Spanish");
    if (!dict) to.addEventListener("change", () => picker.set(studyLanguages[to.value]));

    openModal({
        title: dict ? t("dict.settings") : t("dict.create"),
        build: (close) => form({
            onCancel: close,
            onSubmit: () => {
                const data = {
                    name: name.value.trim() || `${from.value} → ${to.value}`,
                    description: description.value.trim(),
                    emoji: picker.get(), from: from.value, to: to.value,
                };
                close();
                if (dict) store.updateDictionary(dict.id, data);
                else openDictionary(store.addDictionary(data).id);
            },
        },
            h("div", { class: "field-pair" }, field(t("dict.from"), from), field(t("dict.to"), to)),
            field(t("dict.name"), name),
            field(t("dict.description"), description),
            h("div", { class: "field" }, h("span", { class: "field-label" }, t("dict.icon")), picker.el)),
    });
}

export function confirmRemoveDictionary(dict, after) {
    confirmModal({
        title: t("dict.deleteTitle"),
        text: t("dict.deleteText", { name: dict.name }),
        action: t("common.delete"),
        onConfirm: () => { store.removeDictionary(dict.id); after?.(); },
    });
}

function openWordForm(dictId, word) {
    const dict = store.getDictionary(dictId);
    const original = textInput(word?.word, "", 120);
    const translation = textInput(word?.translation, "", 120);
    openModal({
        title: word ? t("word.edit") : t("word.add"),
        build: (close) => form({
            onCancel: close,
            onSubmit: () => {
                if (!requireValue(original) || !requireValue(translation)) return;
                const data = { word: original.value.trim(), translation: translation.value.trim() };
                if (word) {
                    store.updateWord(dictId, word.id, data);
                    close();
                } else {
                    // Stay open so several words can be added in a row.
                    store.addWord(dictId, data);
                    original.value = translation.value = "";
                    original.focus();
                }
            },
        }, field(`${t("word.word")} (${dict.from})`, original), field(`${t("word.translation")} (${dict.to})`, translation)),
    });
}

// Word list of one dictionary; redraws itself while open.
export function openDictionary(dictId) {
    const body = h("div", { class: "stack" });
    let close;

    const wordRow = (word) => h("div", { class: "row" },
        h("div", { class: "row-main" },
            h("strong", {}, word.word, word.learned && h("span", { class: "learned", title: t("word.learned") }, " ✓")),
            h("small", { class: "muted" }, word.translation)),
        h("button", {
            class: `icon-btn ${word.isFavourite ? "is-favourite" : ""}`, type: "button",
            "aria-label": t("word.favourite"), "aria-pressed": String(word.isFavourite),
            onClick: () => store.updateWord(dictId, word.id, { isFavourite: !word.isFavourite }),
        }, icon("bookmark")),
        h("button", { class: "icon-btn", type: "button", "aria-label": t("common.edit"), onClick: () => openWordForm(dictId, word) }, icon("edit")),
        h("button", {
            class: "icon-btn is-danger", type: "button", "aria-label": t("common.delete"),
            onClick: () => confirmModal({
                title: t("word.deleteTitle"), text: `${word.word} — ${word.translation}`,
                action: t("common.delete"), onConfirm: () => store.removeWord(dictId, word.id),
            }),
        }, icon("trash")));

    const draw = () => {
        const dict = store.getDictionary(dictId);
        if (!dict) return close?.();
        const scroll = body.closest(".modal-panel")?.scrollTop ?? 0;
        body.replaceChildren(
            h("p", { class: "muted" }, [dict.description, t("words.count", { count: dict.words.length })].filter(Boolean).join(" · ")),
            h("div", { class: "actions" },
                h("button", { class: "btn btn-soft", type: "button", onClick: () => openDictionaryForm(dict) }, t("common.edit")),
                h("button", { class: "btn btn-primary", type: "button", onClick: () => openWordForm(dictId) }, `+ ${t("word.add")}`)),
            h("div", { class: "word-list" }, dict.words.length ? dict.words.map(wordRow) : h("p", { class: "muted" }, t("dict.noWords"))));
        body.closest(".modal-panel")?.scrollTo(0, scroll);
        const title = body.closest("dialog")?.querySelector(".modal-title");
        if (title) title.textContent = `${dict.emoji} ${dict.name}`;
    };

    draw();
    const dict = store.getDictionary(dictId);
    const unsubscribe = store.subscribe((type) => type !== "time" && draw());
    close = openModal({ title: `${dict.emoji} ${dict.name}`, build: () => body });
    body.closest("dialog").addEventListener("close", unsubscribe);
}
