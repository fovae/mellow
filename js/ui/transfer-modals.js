import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { dayKey } from "../core/dates.js";
import * as store from "../core/store.js";
import { MAX_WORDS, parseWords, toCSV } from "../core/transfer.js";
import { openModal, confirmModal, requireValue } from "./modal.js";
import { pickFile, safeName, saveFile } from "./files.js";
import { icon } from "./icons.js";

const PREVIEW = 5;

export const openMessage = (title, text) => openModal({ title, build: () => h("p", { class: "muted" }, text) });

export function openWordImport(dictId) {
    const input = h("textarea", {
        class: "input input-area", rows: 6, placeholder: t("import.placeholder"), "aria-label": t("import.title"),
        autocapitalize: "off", spellcheck: "false", onInput: () => draw(),
    });
    const preview = h("div", { class: "stack", role: "status" });
    const submit = h("button", { class: "btn btn-primary btn-wide", type: "button", onClick: () => save() });
    const parse = () => parseWords(input.value, store.getDictionary(dictId)?.words);
    let close;

    function draw() {
        const { words, duplicates, invalid } = parse();
        submit.textContent = words.length ? t("import.add", { count: words.length }) : t("import.title");
        submit.disabled = !words.length;
        preview.replaceChildren(...[
            words.length && h("div", { class: "card word-list" }, words.slice(0, PREVIEW).map((w) =>
                h("div", { class: "row" }, h("span", { class: "row-main" }, h("strong", {}, w.word), h("small", { class: "muted" }, w.translation)))),
                words.length > PREVIEW && h("p", { class: "muted" }, t("import.more", { count: words.length - PREVIEW }))),
            duplicates && h("p", { class: "muted" }, t("import.duplicates", { count: duplicates })),
            invalid && h("p", { class: "muted" }, t("import.invalid", { count: invalid, max: MAX_WORDS })),
        ].filter(Boolean));
    }

    function save() {
        if (!requireValue(input)) return;
        store.addWords(dictId, parse().words);
        close();
    }

    draw();
    close = openModal({
        title: t("import.title"),
        build: () => h("div", { class: "stack" },
            h("p", { class: "muted" }, t("import.text")),
            input,
            h("button", {
                class: "btn btn-soft btn-wide", type: "button",
                onClick: () => pickFile(".csv,.tsv,.txt,text/plain,text/csv", (text) => {
                    if (text === null) return openMessage(t("import.title"), t("file.error"));
                    input.value = text;
                    draw();
                }),
            }, icon("folder"), t("import.file")),
            preview, submit),
    });
}

export const exportWords = (dict) => saveFile(`${safeName(dict.name)}.csv`, "text/csv", toCSV(dict.words));

export async function saveBackup() {
    if (await saveFile(`mellow-${dayKey()}.json`, "application/json", store.getBackup())) store.markBackup();
}

export function restoreBackup() {
    pickFile(".json,application/json", (text) => {
        const next = text === null ? null : store.readBackup(text);
        if (!next) return openMessage(t("backup.restore"), t("backup.invalid"));
        confirmModal({
            title: t("backup.restoreTitle"),
            text: t("backup.restoreText", {
                name: next.username || "—",
                dictionaries: next.dictionaries.length,
                words: next.dictionaries.reduce((sum, d) => sum + d.words.length, 0),
            }),
            action: t("backup.restore"),
            onConfirm: () => store.restore(next),
        });
    });
}
