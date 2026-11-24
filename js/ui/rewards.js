// Shop and reward messages.
import { art, withDrop } from "./art.js";
import { h } from "../core/dom.js";
import { t } from "../core/i18n.js";
import { accents } from "../core/accents.js";
import { FREEZE } from "../core/rewards.js";
import { play } from "../core/sound.js";
import { buyAccent, buyFreeze, getState, subscribe, updateSettings } from "../core/store.js";
import { openModal } from "./modal.js";
import { cell, group } from "./cells.js";
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
    art("💧"), h("strong", {}, getState().drops));

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
            h("span", {}, t(`accent.${id}`)), locked && h("small", { class: "muted" }, withDrop(price)));
    }));
}

export function openShop() {
    const body = h("div", { class: "stack" });
    const draw = () => {
        const { drops, freezes } = getState();
        const full = freezes >= FREEZE.max;
        body.replaceChildren(
            h("section", { class: "hero shop-hero" }, mascot("happy"), h("div", {}, h("strong", { class: "hero-title" }, withDrop(drops)), h("p", { class: "hero-text" }, t("drops.how")))),
            group(t("freeze.title"), [cell({
                emoji: "🧊", label: t("freeze.have", { count: freezes, max: FREEZE.max }),
                control: h("button", {
                    class: "btn btn-soft btn-small", type: "button", disabled: full || drops < FREEZE.price,
                    onClick: () => { buyFreeze(); play("right"); },
                }, full ? t("freeze.full") : withDrop(FREEZE.price)),
            })], { foot: t("freeze.text") }),
            section(t("accent.title"), accentPicker()));
    };
    openLive(t("shop.title"), body, draw);
}

// A sheet that follows the state while it is open.
function openLive(title, body, draw) {
    draw();
    const unsubscribe = subscribe((type) => type !== "time" && draw());
    openModal({ title, build: () => body });
    body.closest("dialog").addEventListener("close", unsubscribe);
}

export function openAccents() {
    const body = h("div", { class: "stack" });
    openLive(t("accent.title"), body, () => body.replaceChildren(h("div", { class: "card" }, accentPicker()), h("p", { class: "group-foot" }, t("drops.how"))));
}
