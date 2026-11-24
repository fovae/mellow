// Level, quests, shop and reward messages.
import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { accents } from "../core/accents.js";
import { FREEZE, DROPS, dailyQuests, levelInfo, totalXp } from "../core/rewards.js";
import { dayKey } from "../core/dates.js";
import { play } from "../core/sound.js";
import { buyAccent, buyFreeze, getDay, getState, subscribe, updateSettings } from "../core/store.js";
import { openModal } from "./modal.js";
import { icon } from "./icons.js";
import { mascot } from "./mascot.js";
import { section } from "./parts.js";
import { toast } from "./toast.js";

export function showRewards(events) {
    for (const event of events) {
        const drops = event.drops ? t("drops.plus", { count: event.drops }) : "";
        if (event.type === "quest") toast("🎯", t("quest.done"), drops);
        if (event.type === "chest") toast("🎁", t("quest.chest"), drops);
        if (event.type === "goal") toast("🌤️", t("home.goalDone"));
        if (event.type === "level") toast("✨", t("level.up", { level: event.level }), drops);
        if (event.type === "freeze") toast("🧊", t("freeze.used"), t("freeze.usedText"));
    }
    if (events.some((e) => e.type === "level" || e.type === "chest")) play("done");
}

export const dropsChip = () => h("button", { class: "chip-stat", type: "button", "aria-label": `${t("drops.title")}: ${getState().drops}`, onClick: openShop },
    h("span", { "aria-hidden": "true" }, "💧"), h("strong", {}, getState().drops));

export function levelCard() {
    const { level, done, need } = levelInfo(totalXp(getState().log));
    return h("section", { class: "card level-card" },
        mascot("happy"),
        h("div", { class: "row-main" },
            h("h2", { class: "section-title" }, t("level.title", { level })),
            h("div", { class: "bar" }, h("div", { class: "bar-fill", style: { width: `${(done / need) * 100}%` } })),
            h("small", { class: "muted" }, t("level.left", { count: need - done }))));
}

export function questsSection() {
    const { quests } = getState();
    const key = dayKey();
    const day = getDay();
    const rewarded = quests.day === key ? quests.done : [];
    return section(t("quest.title"), dailyQuests(key).map((quest) => {
        const value = Math.min(quest.goal, day[quest.field] ?? 0);
        const done = rewarded.includes(quest.id);
        return h("div", { class: `row quest ${done ? "is-done" : ""}` },
            h("span", { class: "quest-icon" }, icon(done ? "check" : "target")),
            h("span", { class: "row-main" }, h("strong", {}, t(`quest.${quest.id}`, { count: quest.goal })),
                h("span", { class: "bar" }, h("span", { class: "bar-fill", style: { width: `${(value / quest.goal) * 100}%` } }))),
            h("small", { class: "muted" }, done ? `+${DROPS.quest} 💧` : `${value} / ${quest.goal}`));
    }));
}

// Swatches of colour styles. Locked ones are bought with drops.
export function accentPicker() {
    const { settings, owned, drops } = getState();
    return h("div", { class: "swatches", role: "group", "aria-label": t("accent.title") }, accents.map(({ id, price }) => {
        const locked = price > 0 && !owned.includes(id);
        const isActive = settings.accent === id;
        return h("button", {
            class: `swatch ${isActive ? "is-active" : ""}`, type: "button", "aria-pressed": String(isActive),
            onClick: () => {
                if (!locked) return updateSettings({ accent: id });
                if (drops < price) return toast("💧", t("drops.few"), t("drops.need", { count: price - drops }));
                buyAccent(id);
                play("done");
            },
        }, h("span", { class: "swatch-dot", "data-accent": id }, isActive && icon("check")),
            h("span", {}, t(`accent.${id}`)), locked && h("small", { class: "muted" }, `${price} 💧`));
    }));
}

export function openShop() {
    const body = h("div", { class: "stack" });
    const draw = () => {
        const { drops, freezes } = getState();
        const full = freezes >= FREEZE.max;
        body.replaceChildren(
            h("section", { class: "hero shop-hero" }, mascot("happy"), h("div", {}, h("strong", { class: "hero-title" }, `${drops} 💧`), h("p", { class: "hero-text" }, t("drops.how")))),
            section(t("freeze.title"),
                h("p", { class: "muted" }, t("freeze.text")),
                h("div", { class: "row" }, h("span", { class: "row-emoji" }, "🧊"),
                    h("span", { class: "row-main" }, h("strong", {}, t("freeze.have", { count: freezes, max: FREEZE.max }))),
                    h("button", {
                        class: "btn btn-soft btn-small", type: "button", disabled: full || drops < FREEZE.price,
                        onClick: () => { buyFreeze(); play("right"); },
                    }, full ? t("freeze.full") : `${FREEZE.price} 💧`))),
            section(t("accent.title"), accentPicker()));
    };
    draw();
    const unsubscribe = subscribe((type) => type !== "time" && draw());
    openModal({ title: t("shop.title"), build: () => body });
    body.closest("dialog").addEventListener("close", unsubscribe);
}
