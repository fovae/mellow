import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { getActiveDictionary, updateWord, updateDictionary } from "../core/store.js";
import { screenHeader } from "../ui/navigation.js";
import { openDictionaryPicker } from "../ui/dictionary-picker.js";

// Session order of word ids; "Again" moves a word to the end.
let queue = [];
let queueDictId = null;

function syncQueue(dict) {
    const pending = dict.words.filter((w) => !w.learned).map((w) => w.id);
    if (queueDictId !== dict.id) queue = [];
    queueDictId = dict.id;
    queue = [...queue.filter((id) => pending.includes(id)), ...pending.filter((id) => !queue.includes(id))];
}

const message = (text, label, onClick) => h("div", { class: "card empty" },
    h("p", {}, text), label && h("button", { class: "btn btn-primary", type: "button", onClick }, label));

export function renderCards(rerender) {
    const header = screenHeader(t("cards.title"), t("cards.subtitle"));
    const dict = getActiveDictionary();
    if (!dict) return [header, message(t("cards.noDict"), t("cards.choose"), openDictionaryPicker)];
    if (!dict.words.length) return [header, message(t("cards.noWords"), t("cards.choose"), openDictionaryPicker)];

    syncQueue(dict);
    const word = dict.words.find((w) => w.id === queue[0]);
    if (!word) {
        return [header, message(t("cards.done"), t("cards.restart"), () =>
            updateDictionary(dict.id, { words: dict.words.map((w) => ({ ...w, learned: false })) }))];
    }

    const face = (side, label, text, lang, hidden) => h("span", { class: `flashcard-face flashcard-${side}`, "aria-hidden": String(hidden) },
        h("span", { class: "flashcard-label" }, lang || label), h("span", { class: "flashcard-word" }, text));
    const front = face("front", t("cards.word"), word.word, dict.from, false);
    const back = face("back", t("cards.translation"), word.translation, dict.to, true);
    const card = h("button", {
        class: "flashcard", type: "button",
        onClick: () => {
            const flipped = card.classList.toggle("is-flipped");
            front.setAttribute("aria-hidden", String(flipped));
            back.setAttribute("aria-hidden", String(!flipped));
        },
    }, front, back);

    return [
        header,
        h("div", { class: "card" },
            h("div", { class: "dict-top" }, h("strong", {}, `${dict.emoji} ${dict.name}`), h("span", { class: "muted dict-count" }, t("cards.left", { count: queue.length }))),
            card,
            h("div", { class: "actions" },
                h("button", { class: "btn btn-again", type: "button", onClick: () => { queue.push(queue.shift()); rerender(); } }, t("cards.again")),
                h("button", { class: "btn btn-good", type: "button", onClick: () => updateWord(dict.id, word.id, { learned: true }) }, t("cards.gotIt")))),
    ];
}
