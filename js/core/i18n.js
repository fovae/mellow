import en from "../i18n/en.js";
import ru from "../i18n/ru.js";
import { getState } from "./store.js";

// To add a language: create js/i18n/<code>.js, register it here and in sw.js.
const packs = { en, ru };

export const languages = [
    { code: "en", name: "English" },
    { code: "ru", name: "Русский" },
];

const current = () => (packs[getState().settings.language] ? getState().settings.language : "en");

export const getLocale = current;

// t("key", { name }) replaces {name}. A plural entry is an object and is chosen by `count`.
export function t(key, vars = {}) {
    const lang = current();
    let text = packs[lang][key] ?? en[key] ?? key;
    if (typeof text === "object") {
        text = text[new Intl.PluralRules(lang).select(vars.count)] ?? text.other;
    }
    return text.replace(/\{(\w+)\}/g, (match, name) => vars[name] ?? match);
}

export function formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours ? t("time.hm", { hours, minutes }) : t("time.m", { minutes });
}
