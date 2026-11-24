import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import * as store from "../core/store.js";
import { getStatus } from "../core/srs.js";
import { normalize } from "../core/quiz.js";
import { MAX_TEXT, wordKey } from "../core/transfer.js";
import { studyLanguages, dictionaryIcons, languageFlag, languageName } from "../data/languages.js";
import { openModal, confirmModal, form, field, requireValue } from "./modal.js";
import { exportWords, openWordImport } from "./transfer-modals.js";
import { icon } from "./icons.js";
import { segmented, speakButton, statusBar, statusLegend } from "./parts.js";

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
    const picker = iconPicker(dict?.emoji ?? languageFlag("Spanish"));
    const select = (value) => h("select", { class: "input" },
        studyLanguages.map((lang) => h("option", { value: lang, selected: lang === value }, languageName(lang, getLocale()))));
    const from = select(dict?.from ?? "English");
    const to = select(dict?.to ?? "Spanish");
    if (!dict) to.addEventListener("change", () => picker.set(languageFlag(to.value)));
    const label = (el) => languageName(el.value, getLocale());

    openModal({
        title: dict ? t("dict.settings") : t("dict.new"),
        build: (close) => [form({
            onCancel: close,
            onSubmit: () => {
                const data = {
                    name: name.value.trim() || `${label(from)} → ${label(to)}`,
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
        ...(dict ? [h("button", {
            class: "btn btn-danger-soft btn-wide form-extra", type: "button",
            onClick: () => confirmModal({
                title: t("dict.deleteTitle"), text: t("dict.deleteText", { name: dict.name }), action: t("common.delete"),
                onConfirm: () => { close(); store.removeDictionary(dict.id); },
            }),
        }, t("dict.delete"))] : [])],
    });
}

function openWordForm(dictId, word) {
    const dict = store.getDictionary(dictId);
    const original = textInput(word?.word, "", MAX_TEXT);
    const translation = textInput(word?.translation, "", MAX_TEXT);
    const error = h("p", { class: "feedback is-wrong", role: "status" });
    openModal({
        title: word ? t("word.edit") : t("word.add"),
        build: (close) => [form({
            onCancel: close,
            onSubmit: () => {
                if (!requireValue(original) || !requireValue(translation)) return;
                const data = { word: original.value.trim(), translation: translation.value.trim() };
                const same = (w) => w.id !== word?.id && wordKey(w) === wordKey(data);
                error.textContent = store.getDictionary(dictId).words.some(same) ? t("word.duplicate") : "";
                if (error.textContent) return;
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
        }, field(languageName(dict.from, getLocale()), original), field(languageName(dict.to, getLocale()), translation), error),
        ...(word ? [h("button", {
            class: "btn btn-danger-soft btn-wide form-extra", type: "button",
            onClick: () => confirmModal({
                title: t("word.deleteTitle"), text: `${word.word} — ${word.translation}`, action: t("common.delete"),
                onConfirm: () => { close(); store.removeWord(dictId, word.id); },
            }),
        }, t("word.delete"))] : [])],
    });
}

// Page of one dictionary; redraws the changing parts while open.
export function openDictionary(dictId) {
    let close;
    let filter = "all";
    const top = h("div", { class: "stack" });
    const filters = h("div");
    const list = h("div", { class: "card word-list" });
    const search = h("input", { class: "input", type: "search", placeholder: t("dict.search"), "aria-label": t("dict.search"), onInput: () => drawList() });

    const wordRow = (dict, word) => h("div", { class: "row" },
        h("i", { class: `dot is-${getStatus(word.srs)}`, title: t(`status.${getStatus(word.srs)}`) }),
        h("button", { class: "row-main row-edit", type: "button", "aria-label": `${t("common.edit")}: ${word.word}`, onClick: () => openWordForm(dictId, word) },
            h("strong", {}, word.word), h("small", { class: "muted" }, word.translation)),
        speakButton(word.translation, dict.to),
        h("button", {
            class: `icon-btn ${word.isFavourite ? "is-favourite" : ""}`, type: "button",
            "aria-label": `${t("word.favourite")}: ${word.word}`, "aria-pressed": String(word.isFavourite),
            onClick: () => store.updateWord(dictId, word.id, { isFavourite: !word.isFavourite }),
        }, icon("bookmark")));

    function drawList() {
        const dict = store.getDictionary(dictId);
        const query = normalize(search.value);
        const words = dict.words.filter((w) =>
            (filter === "all" || getStatus(w.srs) === filter) &&
            (!query || normalize(w.word).includes(query) || normalize(w.translation).includes(query)));
        list.replaceChildren(...(words.length
            ? words.map((word) => wordRow(dict, word))
            : [h("p", { class: "muted" }, dict.words.length ? t("dict.notFound") : t("dict.noWords"))]));
    }

    function draw() {
        const dict = store.getDictionary(dictId);
        if (!dict) return close?.();
        const isActive = store.getState().activeDictionaryId === dictId;
        top.replaceChildren(...[
            dict.description && h("p", { class: "muted" }, dict.description),
            h("div", { class: "card" }, statusBar(dict.words), statusLegend(dict.words)),
            h("div", { class: "actions" },
                !isActive && h("button", { class: "btn btn-soft", type: "button", onClick: () => store.setActiveDictionary(dictId) }, t("dict.use")),
                h("button", { class: "btn btn-primary", type: "button", onClick: () => openWordForm(dictId) }, icon("plus"), t("word.add"))),
            h("div", { class: "actions" },
                h("button", { class: "btn btn-soft", type: "button", onClick: () => openWordImport(dictId) }, icon("download"), t("import.short")),
                dict.words.length > 0 && h("button", { class: "btn btn-soft", type: "button", onClick: () => exportWords(dict) }, icon("share"), t("export.short"))),
        ].filter(Boolean));
        filters.replaceChildren(segmented(t("profile.words"),
            ["all", "new", "learning", "mastered"].map((value) => ({ value, label: t(value === "all" ? "dict.all" : `status.${value}`) })),
            filter, (value) => { filter = value; draw(); }));
        drawList();
        const title = top.closest("dialog")?.querySelector(".modal-title");
        if (title) title.textContent = `${dict.emoji} ${dict.name}`;
    }

    draw();
    const dict = store.getDictionary(dictId);
    const unsubscribe = store.subscribe((type) => type !== "time" && draw());
    close = openModal({
        title: `${dict.emoji} ${dict.name}`,
        className: "modal-page",
        actions: [h("button", { class: "icon-btn", type: "button", "aria-label": t("dict.settings"), onClick: () => openDictionaryForm(store.getDictionary(dictId)) }, icon("settings"))],
        build: () => h("div", { class: "stack" }, top, search, filters, list),
    });
    top.closest("dialog").addEventListener("close", unsubscribe);
}
