// A topic in one sheet: progress, adding a word right there, search and the words.
// Library topics and "My words" (the person's own words of the course) open the same way.
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import * as store from "../core/store.js";
import { getStatus } from "../core/srs.js";
import { normalize } from "../core/quiz.js";
import { MAX_EXAMPLE, MAX_TEXT, wordKey } from "../core/transfer.js";
import { loadLibrary, suggest } from "../core/library.js";
import { languageName } from "../data/languages.js";
import { openModal, confirmModal, form, field, requireValue } from "./modal.js";
import { cell, group } from "./cells.js";
import { mascot } from "./mascot.js";
import { icon } from "./icons.js";
import { speakButton, statusBar, statusLegend, topicName } from "./parts.js";

const SEARCH_FROM = 8; // words; fewer fit on the screen anyway

const input = (value = "", maxlength = MAX_TEXT, attrs = {}) =>
    h("input", { class: "input", value, maxlength, autocomplete: "off", autocorrect: "off", spellcheck: "false", ...attrs });

// Library translations under the fields: works offline, nothing is sent anywhere.
function suggestions(dict, target, native, example) {
    const tips = h("div", { class: "tags" });
    const draw = (from, side) => {
        const list = from.value.trim() ? suggest(from.value, side, dict.from, dict.to) : [];
        tips.replaceChildren(...list.map((pair) => h("button", {
            class: "tag tag-btn", type: "button", onPointerdown: (event) => event.preventDefault(),
            onClick: () => {
                native.value = pair.word;
                target.value = pair.translation;
                if (example && pair.example) example.value = pair.example;
                tips.replaceChildren();
            },
        }, h("strong", {}, pair.translation), ` ${pair.word}`)));
    };
    target.addEventListener("input", () => draw(target, "translation"));
    native.addEventListener("input", () => draw(native, "word"));
    loadLibrary();
    return { tips, clear: () => tips.replaceChildren() };
}

// Editing one word (a tap on it): the only sheet that opens over a topic.
export function openWordForm(dictId, word) {
    const dict = store.getDictionary(dictId);
    const target = input(word.translation);
    const native = input(word.word);
    const example = input(word.example, MAX_EXAMPLE);
    const error = h("p", { class: "feedback is-wrong", role: "status" });
    const { tips } = suggestions(dict, target, native, example);
    openModal({
        title: t("word.edit"),
        build: (close) => [form({
            onCancel: close,
            onSubmit: () => {
                if (!requireValue(target) || !requireValue(native)) return;
                const data = { word: native.value.trim(), translation: target.value.trim(), example: example.value.trim() };
                const same = (w) => w.id !== word.id && wordKey(w) === wordKey(data);
                error.textContent = store.getDictionary(dictId).words.some(same) ? t("word.duplicate") : "";
                if (error.textContent) return;
                store.updateWord(dictId, word.id, data);
                close();
            },
        }, field(languageName(dict.from, getLocale()), native), field(languageName(dict.to, getLocale()), target), tips, field(t("word.example"), example), error),
        h("button", {
            class: "btn btn-danger-soft btn-wide form-extra", type: "button",
            onClick: () => confirmModal({
                title: t("word.deleteTitle"), text: `${word.translation} — ${word.word}`, action: t("common.delete"),
                onConfirm: () => { close(); store.removeWord(dictId, word.id); },
            }),
        }, t("word.delete"))],
    });
}

// Adding a word inside the topic sheet: two fields and a button, the keyboard stays open for the next one.
function addForm(dictId) {
    const dict = store.getDictionary(dictId);
    const native = input("", MAX_TEXT, { class: "input cell-input", placeholder: t("word.nativeHint") });
    const target = input("", MAX_TEXT, { class: "input cell-input", placeholder: t("word.targetHint"), autocapitalize: "off" });
    const error = h("p", { class: "feedback is-wrong", role: "status" });
    const { tips, clear } = suggestions(dict, target, native);
    const row = (label, field) => h("label", { class: "cell auth-field" }, h("span", { class: "auth-label" }, label), field);
    return h("form", {
        class: "add-word", novalidate: true,
        onSubmit: (event) => {
            event.preventDefault();
            if (!requireValue(target) || !requireValue(native)) return;
            const data = { word: native.value.trim(), translation: target.value.trim(), example: "" };
            error.textContent = store.getDictionary(dictId).words.some((w) => wordKey(w) === wordKey(data)) ? t("word.duplicate") : "";
            if (error.textContent) return;
            store.addWord(dictId, data);
            target.value = native.value = "";
            clear();
            native.focus({ preventScroll: true });
        },
    },
        group(t("word.add"), [row(languageName(dict.from, getLocale()), native), row(languageName(dict.to, getLocale()), target)]),
        tips, error,
        // The button does not take the focus: the keyboard stays open and the screen does not jump.
        h("button", { class: "btn btn-soft btn-wide", type: "submit", onPointerdown: (event) => event.preventDefault() }, icon("plus"), t("word.addAction")));
}

// The page of one topic; the changing parts redraw while it is open.
export function openDictionary(dictId, { add = false } = {}) {
    const top = h("div", { class: "stack" });
    const list = h("div", { class: "card word-list" });
    const search = h("input", { class: "input", type: "search", placeholder: t("dict.search"), "aria-label": t("dict.search"), onInput: () => drawList() });
    const searchBox = h("div", {}, search);
    let close;

    const wordRow = (dict, word) => h("div", { class: "row" },
        h("i", { class: `dot is-${getStatus(word.srs)}`, title: t(`status.${getStatus(word.srs)}`) }),
        h("button", { class: "row-main row-edit", type: "button", "aria-label": `${t("common.edit")}: ${word.translation}`, onClick: () => openWordForm(dictId, word) },
            h("strong", {}, word.translation), h("small", { class: "muted" }, word.word), word.example && h("small", { class: "example" }, word.example)),
        speakButton(word.translation, dict.to));

    function drawList() {
        const dict = store.getDictionary(dictId);
        const query = normalize(search.value);
        const words = dict.words.filter((w) => !query || normalize(w.word).includes(query) || normalize(w.translation).includes(query));
        searchBox.hidden = dict.words.length < SEARCH_FROM;
        list.hidden = !dict.words.length;
        list.replaceChildren(...(words.length
            ? [...words].reverse().map((word) => wordRow(dict, word))
            : [h("div", { class: "empty" }, mascot("sad"), h("p", { class: "muted" }, t("dict.notFound")))]));
    }

    function draw() {
        const dict = store.getDictionary(dictId);
        if (!dict) return close?.();
        const isCurrent = store.getCurrentTopic()?.id === dictId || dict.words.every((w) => w.srs);
        top.replaceChildren(...[
            dict.words.length > 0 && h("div", { class: "card" }, statusBar(dict.words), statusLegend(dict.words)),
            !dict.words.length && dict.mine && h("p", { class: "muted" }, t("dict.mineText")),
            !isCurrent && dict.words.length > 0 && group(null, [cell({ icon: "play", tint: 1, label: t("dict.use"), sub: t("dict.useText"), chevron: false, onClick: () => store.learnFirst(dictId) })]),
        ].filter(Boolean));
        drawList();
    }

    const dict = store.getDictionary(dictId);
    const remove = !dict.mine && group(null, [cell({
        icon: "trash", danger: true, label: t("dict.remove"),
        onClick: () => confirmModal({
            title: t("dict.removeTitle"), text: t("dict.removeText", { name: topicName(dict) }), action: t("dict.removeAction"),
            onConfirm: () => store.removeDictionary(dictId),
        }),
    })]);
    draw();
    const unsubscribe = store.subscribe((type) => type !== "time" && draw());
    close = openModal({
        title: topicName(dict),
        emoji: dict.emoji,
        className: "modal-page",
        build: () => h("div", { class: "stack" }, top, addForm(dictId), searchBox, list, remove),
    });
    const dialog = top.closest("dialog");
    dialog.addEventListener("close", unsubscribe);
    // Synchronously, inside the tap: iOS opens the keyboard only then.
    if (add) dialog.querySelector(".add-word input").focus();
}

// "My words" is created the first time it is opened.
export const openMyWords = (options) => openDictionary(store.ensureMyWords(t("dict.mine")).id, options);
