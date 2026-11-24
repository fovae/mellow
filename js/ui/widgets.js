// Widgets of the home screen. Sizes: wide (two columns) and square (one column).
import { art, withDrop } from "./art.js";
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { dayKey, lastDays } from "../core/dates.js";
import { buildPath } from "../core/lessons.js";
import { DROPS, dailyQuests } from "../core/rewards.js";
import { getCurrentTopic, getDictionaries, getDay, getDifficult, getScopeQueue, getState, getStreak } from "../core/store.js";
import { studyAll, trainDifficult, quickAdd } from "./actions.js";
import { canPlayPairs, canPlaySentences, canPlaySprint, openPairs, openSentences, openSprint } from "./games.js";
import { icon } from "./icons.js";
import { openLesson } from "./lesson.js";
import { openLibrary } from "./library-modal.js";
import { mascot } from "./mascot.js";
import { navigate } from "./navigation.js";
import { ring, speakButton } from "./parts.js";
import { openTest } from "./test-session.js";
import { openStats } from "./stats.js";
import { toast } from "./toast.js";

const TIPS = 8;
const SECONDS_PER_WORD = 12;
export const dayNumber = () => [...dayKey()].reduce((sum, c) => (sum * 31 + c.charCodeAt(0)) >>> 0, 7);
let tip = dayNumber();

// onClick makes the widget a button.
function widget(size, { onClick, className = "", label, disabled = false }, ...children) {
    return h(onClick ? "button" : "section", {
        class: `widget widget-${size} ${className}`, "aria-label": label,
        ...(onClick ? { type: "button", onClick, disabled } : {}),
    }, ...children);
}
const title = (name, text) => h("span", { class: "widget-title" }, name && art(name), h("span", {}, text));

const isNight = () => { const hour = new Date().getHours(); return hour >= 22 || hour < 6; };

export function greeting() {
    const hour = new Date().getHours();
    return t(hour < 5 ? "home.night" : hour < 12 ? "home.morning" : hour < 18 ? "home.afternoon" : "home.evening");
}

// The one main button: everything due in the profile plus the next new words.
export function todayHero() {
    const active = getCurrentTopic();
    const { due, soon, fresh } = getScopeQueue(null);
    const reviews = due.length + soon.length;
    const count = reviews + fresh.length;
    const dictionaries = getDictionaries();
    const button = (name, label, onClick) => h("button", { class: "btn hero-btn", type: "button", onClick }, icon(name), label);

    let head, text, action;
    if (!dictionaries.length) [head, text, action] = [t("hero.hello"), t("hero.noneText"), button("dictionaries", t("library.title"), openLibrary)];
    else if (count) {
        head = t("hero.count", { count });
        text = t("hero.ready", { due: reviews, fresh: fresh.length });
        action = button("play", t("hero.start"), studyAll);
    } else if (!active.words.length) [head, text, action] = [t("hero.hello"), t("hero.empty"), button("plus", t("word.add"), quickAdd)];
    else [head, text, action] = [t("hero.restTitle"), t(active.words.some((w) => !w.srs) ? "hero.rest" : "hero.restAll"), button("tests", t("hero.practice"), () => navigate("tests"))];

    const mello = mascot(!count && active ? "sleepy" : isNight() ? "sleepy" : count ? "happy" : "calm");
    const minutes = Math.max(1, Math.round((count * SECONDS_PER_WORD) / 60));
    return h("section", { class: "hero today-hero" },
        h("div", { class: "today-top" },
            h("div", { class: "today-text" },
                h("span", { class: "eyebrow" }, count ? `${t("hero.today")} · ${t("time.minutesAbout", { count: minutes })}` : t("hero.today")),
                h("h2", { class: "hero-title" }, head),
                h("p", { class: "hero-text" }, text)),
            h("button", {
                class: "mello-btn", type: "button", "aria-label": t("home.tip"),
                onClick: () => {
                    mello.classList.remove("is-hopping");
                    void mello.getBoundingClientRect(); // restart the animation
                    mello.classList.add("is-hopping");
                    toast("💡", t(`tip.${tip++ % TIPS}`));
                },
            }, mello)),
        action);
}

function lessonWidget(dict) {
    const node = buildPath(dict.words).find((n) => n.current);
    if (node) {
        const started = node.words.filter((w) => w.srs).length;
        return widget("wide", { className: "widget-lesson", onClick: () => openLesson(dict.id, node.words.map((w) => w.id)) },
            h("span", { class: "lesson-ring" }, ring(started, node.words.length, icon("play"))),
            h("span", { class: "widget-text" }, h("small", {}, art(dict.emoji), ` ${dict.name}`), h("strong", {}, t("path.number", { count: node.number })),
                h("span", { class: "muted" }, node.words.slice(0, 3).map((w) => w.translation).join(", "))),
            icon("chevron"));
    }
    // Everything is started and the library has nothing more.
    return widget("wide", { className: "widget-lesson", onClick: openLibrary },
        h("span", { class: "topic-emoji", "aria-hidden": "true" }, art("📚")),
        h("span", { class: "widget-text" }, h("small", {}, t("home.topicDone")), h("strong", {}, t("library.title")), h("span", { class: "muted" }, t("library.text"))),
        icon("chevron"));
}

function goalWidget() {
    const { settings } = getState();
    const { answers } = getDay();
    const done = answers >= settings.dailyGoal;
    return widget("square", { className: `widget-goal ${done ? "is-done" : ""}`, onClick: openStats },
        title("🎯", t("home.goal")),
        ring(answers, settings.dailyGoal, done ? icon("check") : h("span", { class: "goal-value" }, h("strong", {}, answers), h("small", {}, `/ ${settings.dailyGoal}`))));
}

function streakWidget() {
    const streak = getStreak();
    const { frozen } = getState();
    const done = getDay().answers > 0;
    return widget("square", { className: `widget-streak ${done ? "is-lit" : ""}`, onClick: openStats, label: `${t("profile.streak")}: ${streak}` },
        title(null, t("home.streak")),
        h("span", { class: "streak-value" }, h("span", { class: "flame", "aria-hidden": "true" }, art("🔥")), h("strong", {}, streak)),
        h("span", { class: "streak-days" }, lastDays(7).map((date) => {
            const state = getDay(date).answers ? "is-on" : frozen[dayKey(date)] ? "is-frozen" : "";
            return h("span", {}, h("i", { class: state }), h("small", {}, date.toLocaleDateString(getLocale(), { weekday: "narrow" })));
        })));
}

// The word of the day is hidden until it is tapped, so it can be recalled first.
let revealed = "";
function wordWidget(dict) {
    const word = dict.words[dayNumber() % dict.words.length];
    const key = `${dayKey()}${word.id}`;
    const meaning = h("span", { class: "word-meaning" });
    const draw = () => {
        const open = revealed === key;
        meaning.textContent = open ? word.word : t("home.reveal");
        meaning.classList.toggle("is-open", open);
    };
    draw();
    return widget("wide", { className: "widget-word" },
        h("button", { class: "word-main", type: "button", onClick: () => { revealed = revealed === key ? "" : key; draw(); } },
            title("💡", t("home.wordOfDay")), h("strong", {}, word.translation), meaning),
        speakButton(word.translation, dict.to));
}

function difficultWidget() {
    const count = getDifficult().length;
    return widget("square", { className: "widget-small", disabled: !count, onClick: trainDifficult },
        h("span", { class: "widget-art" }, art(count ? "⭐" : "✅")),
        h("strong", { class: "widget-big" }, count), h("span", { class: "muted" }, t(count ? "cards.difficult" : "home.noDifficult")));
}

// Another game every day.
function gameWidget(dict) {
    const games = [["pairs", "🃏", canPlayPairs, openPairs], ["sentences", "💬", canPlaySentences, openSentences], ["sprint", "⚡", canPlaySprint, openSprint]].filter(([, , can]) => can(dict));
    if (!games.length) return null;
    const [name, iconName, , open] = games[dayNumber() % games.length];
    return widget("square", { className: "widget-small widget-game", onClick: () => open(dict.id) },
        h("span", { class: "widget-art" }, art(iconName)),
        h("small", {}, t("home.gameOfDay")), h("strong", {}, t(`games.${name}`)));
}

function addWidget(size) {
    const isWide = size === "wide";
    return widget(size, { className: isWide ? "widget-slim" : "widget-small", onClick: quickAdd },
        h("span", { class: "widget-art" }, art("✏️")),
        h("span", { class: "widget-text" }, h("strong", {}, t("word.add")), h("span", { class: "muted" }, t("home.addText"))),
        isWide && icon("chevron"));
}

function questsWidget() {
    const { quests } = getState();
    const key = dayKey();
    const day = getDay();
    const rewarded = quests.day === key ? quests.done : [];
    const list = dailyQuests(key);
    return widget("wide", { className: "widget-quests" },
        h("span", { class: "widget-head" }, title("🏆", t("quest.title")), h("span", { class: "badge" }, `${list.filter((q) => rewarded.includes(q.id)).length} / ${list.length}`)),
        list.map((quest) => {
            const value = Math.min(quest.goal, day[quest.field] ?? 0);
            const done = rewarded.includes(quest.id);
            return h("div", { class: `quest ${done ? "is-done" : ""}` },
                h("span", { class: "quest-top" }, h("span", {}, t(`quest.${quest.id}`, { count: quest.goal })), h("small", {}, done ? withDrop(`+${DROPS.quest}`) : `${value} / ${quest.goal}`)),
                h("span", { class: "bar" }, h("span", { class: "bar-fill", style: { width: `${(value / quest.goal) * 100}%` } })));
        }));
}

// A checkpoint that is ready is offered next to the lesson.
function checkpointWidget(dict) {
    const path = buildPath(dict.words);
    const node = path.filter((n) => n.type === "test" && n.done).at(-1);
    return node && widget("square", {
        className: "widget-small",
        onClick: () => openTest([{ dictId: dict.id, only: new Set(node.words.map((w) => w.id)) }], { mode: "choice", reverse: false, count: 20 }),
    }, h("span", { class: "widget-art" }, art("🏅")), h("strong", {}, t("path.checkpoint")), h("span", { class: "muted" }, t("words.count", { count: node.words.length })));
}

export function widgetGrid() {
    const active = getCurrentTopic();
    const dict = active?.words.length ? active : null;
    const squares = active ? [difficultWidget(), dict && gameWidget(dict), dict && checkpointWidget(dict)].filter(Boolean) : [];
    // Squares go in pairs, so there are no holes in the grid: the last widget becomes wide when needed.
    if (active) squares.push(addWidget(squares.length % 2 ? "square" : "wide"));
    return h("div", { class: "widgets" }, [
        dict && lessonWidget(dict), goalWidget(), streakWidget(),
        dict && wordWidget(dict), ...squares.slice(0, 2), questsWidget(), ...squares.slice(2),
    ].filter(Boolean));
}
