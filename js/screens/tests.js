import { art } from "../ui/art.js";
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { normalize } from "../core/quiz.js";
import { getCurrentTopic, getDictionaries, getState } from "../core/store.js";
import { languageName } from "../data/languages.js";
import { screenHeader, refresh } from "../ui/navigation.js";
import { emptyHero } from "../ui/hero.js";
import { icon } from "../ui/icons.js";
import { segmented } from "../ui/parts.js";
import { cell, choiceCell, group } from "../ui/cells.js";
import { canSpeak } from "../core/speech.js";
import { canPlayPairs, canPlaySentences, canPlaySprint, openPairs, openSentences, openSprint } from "../ui/games.js";
import { openTest } from "../ui/test-session.js";

const options = { topic: "current", mode: "choice", reverse: false, count: 10 };
const set = (key) => (value) => { options[key] = value; refresh(); };

export function renderTests() {
    const header = screenHeader(t("tests.eyebrow"), t("tests.title"));
    const current = getCurrentTopic();
    if (!current?.words.length) return [header, emptyHero()];
    const topics = getDictionaries().filter((d) => d.words.length);
    const isAll = options.topic === "all";
    const dict = topics.find((d) => d.id === options.topic) ?? current;
    // "All" is every word that has been started, in every topic.
    const sources = isAll ? topics.map((d) => ({ dictId: d.id, only: new Set(d.words.filter((w) => w.srs).map((w) => w.id)) })).filter((s) => s.only.size) : [{ dictId: dict.id }];
    const topicOptions = [
        { value: "current", emoji: current.emoji, name: current.name },
        { value: "all", emoji: "📚", name: t("tests.all") },
        ...topics.filter((d) => d !== current).map((d) => ({ value: d.id, emoji: d.emoji, name: d.name })),
    ];

    const distinct = (key) => new Set(dict.words.map((w) => normalize(w[key]))).size;
    const ready = isAll ? sources.length > 0 : distinct("word") >= 2 && distinct("translation") >= 2;
    const direction = [dict.from, dict.to].map((lang) => languageName(lang, getLocale()));
    const records = getState().records ?? {};
    const game = (name, emoji, can, open, record) => cell({
        emoji, label: t(`games.${name}`), sub: can ? t(`games.${name}Text`) : t(`games.${name}Few`),
        value: record && h("span", { class: "badge" }, ...[record].flat()), disabled: !can, onClick: () => open(dict.id),
    });
    const modes = [{ value: "choice", label: t("tests.choice") }, { value: "typing", label: t("tests.typing") }, ...(canSpeak() ? [{ value: "listen", label: t("tests.listen") }] : [])];

    return [
        header,
        h("section", { class: "group" },
            h("h2", { class: "group-title" }, t("tests.new")),
            h("div", { class: "group-card" },
                choiceCell({ icon: "dictionaries", tint: 1, label: t("tests.words"), options: topicOptions, value: topicOptions.some((o) => o.value === options.topic) ? options.topic : "current", onPick: set("topic") }),
                cell({ icon: "edit", tint: 1, label: t("tests.mode"), tall: true, control: segmented(t("tests.mode"), modes, options.mode, set("mode")) }),
                options.mode !== "listen" && choiceCell({
                    icon: "swap", tint: 2, label: t("tests.direction"), value: options.reverse, onPick: set("reverse"),
                    options: [{ value: false, name: `→ ${direction[1]}` }, { value: true, name: `→ ${direction[0]}` }],
                }),
                choiceCell({ icon: "text", tint: 3, label: t("tests.length"), value: options.count, onPick: set("count"), options: [5, 10, 20].map((value) => ({ value, name: String(value) })) })),
            ready
                ? h("button", { class: "btn btn-primary btn-wide group-action", type: "button", onClick: () => openTest(sources, { ...options }) }, icon("play"), t("tests.start"))
                : h("p", { class: "group-foot" }, t(isAll ? "tests.fewAll" : "tests.few"))),
        group(t("games.title"), [
            game("pairs", "🃏", canPlayPairs(dict), openPairs, records.pairs !== undefined && t("time.seconds", { count: records.pairs })),
            game("sentences", "💬", canPlaySentences(dict), openSentences),
            game("sprint", "⚡", canPlaySprint(dict), openSprint, records.sprint !== undefined && [art("⭐"), records.sprint]),
        ]),
    ];
}
