import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { getState, getDay, getStreak, getActiveDictionary, getDifficult, getScopeQueue, getDictQueue, getLibraryKeys, getAnswers, setActiveDictionary } from "../core/store.js";
import { getAdvice } from "../core/advice.js";
import { nextTopic } from "../core/library.js";
import { dayKey } from "../core/dates.js";
import { addTopics, openLibrary, topicTitle } from "../ui/library-modal.js";
import { quickAdd, studyAll, countAll, trainDifficult } from "../ui/actions.js";
import { saveBackup } from "../ui/transfer-modals.js";
import { dropsChip, questsSection } from "../ui/rewards.js";
import { icon } from "../ui/icons.js";
import { screenHeader } from "../ui/navigation.js";
import { heroCard } from "../ui/hero.js";
import { ring, section, speakButton, weekChart } from "../ui/parts.js";

const TIPS = 8;
const dayNumber = () => [...dayKey()].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) >>> 0, 7);

function adviceCards() {
    const { dictionaries, lastBackup } = getState();
    const active = getActiveDictionary();
    const topic = active && nextTopic(active.from, active.to, getLibraryKeys());
    const all = getScopeQueue(null);
    const own = active ? getDictQueue(active) : { due: [], soon: [] };
    const difficult = getDifficult().length;
    const dueElsewhere = all.due.length + all.soon.length - own.due.length - own.soon.length;
    const actions = {
        library: openLibrary, review: studyAll, difficult: trainDifficult, backup: saveBackup,
        next: () => { const [dict] = addTopics([topic], active.from, active.to); if (dict) setActiveDictionary(dict.id); },
    };
    const vars = { count: 0, name: topic ? topicTitle(topic) : "" };
    return getAdvice({
        hasActive: Boolean(active), hasDictionaries: dictionaries.length > 0, dueElsewhere, difficult,
        activeFinished: Boolean(active?.words.length) && active.words.every((w) => w.srs),
        hasNextTopic: Boolean(topic), answers: getAnswers(), lastBackup,
    }).map((id) => h("button", { class: "card advice", type: "button", onClick: actions[id] },
        h("span", { class: "advice-icon" }, icon("bulb")),
        h("span", { class: "row-main" }, h("strong", {}, t(`advice.${id}`, { ...vars, count: id === "review" ? dueElsewhere : difficult })), h("small", { class: "muted" }, t(`advice.${id}Text`))),
        icon("chevron")));
}

function quickMenu() {
    const item = (name, label, onClick, count = 0, disabled = false) => h("button", { class: "quick", type: "button", disabled, onClick },
        h("span", { class: "quick-icon" }, icon(name), count > 0 && h("i", { class: "quick-count" }, count > 99 ? "99+" : count)), h("span", {}, label));
    const difficult = getDifficult().length;
    return h("nav", { class: "quick-grid", "aria-label": t("home.quick") },
        item("dictionaries", t("library.short"), openLibrary),
        item("layers", t("home.reviewShort"), studyAll, countAll(), !countAll()),
        item("star", t("home.difficultShort"), trainDifficult, difficult, !difficult),
        item("plus", t("word.add"), quickAdd));
}

// The same word all day, from the active dictionary.
function wordOfDay() {
    const active = getActiveDictionary();
    if (!active?.words.length) return null;
    const word = active.words[dayNumber() % active.words.length];
    return section(t("home.wordOfDay"), h("div", { class: "row word-day" },
        h("span", { class: "row-main" }, h("strong", {}, word.translation), h("small", { class: "muted" }, word.word), word.example && h("small", { class: "example" }, word.example)),
        speakButton(word.translation, active.to)));
}

export function renderHome() {
    const { username, dictionaries, settings } = getState();
    const { answers } = getDay();
    const streak = getStreak();
    const saved = dictionaries.flatMap((dict) => dict.words.filter((w) => w.isFavourite).map((word) => ({ word, dict })));
    const date = new Date().toLocaleDateString(getLocale(), { weekday: "short", day: "numeric", month: "long" });

    return [
        screenHeader(date, [`${t("home.greeting")} `, h("span", { class: "gradient-text" }, username)],
            h("div", { class: "header-actions" }, dropsChip(), h("div", { class: "chip-stat", role: "img", "aria-label": `${t("profile.streak")}: ${streak}` }, h("span", {}, "🔥"), h("strong", {}, streak)))),
        heroCard(),
        quickMenu(),
        questsSection(),
        ...adviceCards(),
        h("section", { class: "card goal" }, ring(answers, settings.dailyGoal),
            h("div", { class: "row-main" }, h("h2", { class: "section-title" }, t("home.goal")),
                h("p", { class: "muted" }, answers >= settings.dailyGoal ? t("home.goalDone") : t("home.goalText", { done: answers, goal: settings.dailyGoal })))),
        wordOfDay(),
        section(t("home.week"), weekChart()),
        section(t("home.tip"), h("p", { class: "muted tip" }, t(`tip.${dayNumber() % TIPS}`))),
        section(t("home.saved"), saved.length
            ? h("div", { class: "tags" }, saved.slice(0, 20).map(({ word, dict }) =>
                h("span", { class: "tag" }, h("strong", {}, word.word), ` ${word.translation} `, dict.emoji)))
            : h("p", { class: "muted" }, t("home.savedEmpty"))),
    ].filter(Boolean);
}
