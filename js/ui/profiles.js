// Learning profiles: one language pair at a time.
import { h } from "../core/dom.js";
import { t, getLocale } from "../core/i18n.js";
import { libraryKey, loadLibrary, LIBRARY_LANGUAGES, nextTopic } from "../core/library.js";
import { samePair } from "../core/profiles.js";
import * as store from "../core/store.js";
import { languageFlag, languageName, studyLanguages } from "../data/languages.js";
import { cell, group, openChoice } from "./cells.js";
import { dropdown } from "./dropdown.js";
import { icon } from "./icons.js";
import { addTopics, topicTitle } from "./library-modal.js";
import { confirmModal, field, form, openModal } from "./modal.js";
import { toast } from "./toast.js";

const FIRST_TOPICS = 2;
const name = (language) => languageName(language, getLocale());
const pairName = ({ from, to }) => `${name(from)} → ${name(to)}`;

// knowsBasics: the A1 topics are skipped. The course will not add them by itself, but they stay in Topics.
export async function addFirstTopics({ from, to }, { knowsBasics = false } = {}) {
    const topics = await loadLibrary();
    if (!topics || !LIBRARY_LANGUAGES.includes(from) || !LIBRARY_LANGUAGES.includes(to)) return;
    const skipped = knowsBasics ? topics.filter((topic) => topic.level === "A1") : [];
    if (skipped.length) store.skipTopics(skipped.map((topic) => libraryKey(topic.id, from, to)));
    addTopics(topics.filter((topic) => !skipped.includes(topic)).slice(0, FIRST_TOPICS), from, to);
}

// The course goes on by itself: when every word is started, the next topic of the library is added.
export function continueCourse() {
    if (document.querySelector("dialog[open]")) return;
    const { from, to } = store.getProfile();
    const dictionaries = store.getDictionaries();
    if (!dictionaries.some((d) => d.libraryKey) || dictionaries.some((d) => d.words.some((w) => !w.srs))) return;
    const topic = nextTopic(from, to, new Set([...store.getLibraryKeys(), ...store.getState().removedTopics]));
    if (!topic) return;
    addTopics([topic], from, to);
    toast(topic.emoji, t("course.next"), topicTitle(topic));
}

function openNewProfile() {
    const { from, to } = store.getProfile();
    const options = studyLanguages.map((value) => ({ value, name: name(value), emoji: languageFlag(value) }));
    const taken = (language) => language === from || store.getState().profiles.some((p) => samePair(p, { from, to: language }));
    const fromSelect = dropdown({ label: t("library.native"), options, value: from });
    const toSelect = dropdown({ label: t("library.target"), options, value: LIBRARY_LANGUAGES.find((l) => !taken(l)) ?? to });
    const error = h("p", { class: "feedback is-wrong", role: "status" });
    openModal({
        title: t("profiles.add"),
        build: (close) => form({
            onCancel: close,
            onSubmit: () => {
                const pair = { from: fromSelect.value, to: toSelect.value };
                error.textContent = pair.from === pair.to ? t("onboarding.same") : store.getState().profiles.some((p) => samePair(p, pair)) ? t("profiles.exists") : "";
                if (error.textContent) return;
                close();
                store.switchProfile(pair);
                addFirstTopics(pair);
            },
        }, field(t("library.native"), fromSelect), field(t("library.target"), toSelect),
        h("p", { class: "muted" }, t("profiles.addText")), error),
    });
}

function openRemoveProfile() {
    const { profiles } = store.getState();
    openChoice({
        label: t("profiles.remove"), value: null,
        options: profiles.map((p, i) => ({ value: i, name: pairName(p), emoji: languageFlag(p.to) })),
        onPick: (i) => confirmModal({
            title: t("profiles.removeTitle"), action: t("common.delete"),
            text: t("profiles.removeText", { name: pairName(profiles[i]) }),
            onConfirm: () => store.removeProfile(profiles[i]),
        }),
    });
}

export function profilesGroup() {
    const current = store.getProfile();
    const { profiles } = store.getState();
    return group(t("profiles.title"), [
        ...profiles.map((profile) => {
            const isActive = samePair(profile, current);
            const words = store.getDictionaries(profile).reduce((sum, d) => sum + d.words.length, 0);
            return cell({
                emoji: languageFlag(profile.to), label: name(profile.to), className: `profile-row ${isActive ? "is-active" : ""}`, chevron: false,
                sub: `${t("profiles.from", { name: name(profile.from) })} · ${t("words.count", { count: words })}`,
                value: isActive && icon("check"), attrs: { "aria-pressed": String(isActive) },
                onClick: () => {
                    if (isActive) return;
                    store.switchProfile(profile);
                    toast(languageFlag(profile.to), t("profiles.switched"), pairName(profile));
                },
            });
        }),
        cell({ icon: "plus", tint: 2, label: t("profiles.add"), attrs: { "aria-haspopup": "dialog" }, onClick: openNewProfile }),
        profiles.length > 1 && cell({ icon: "trash", danger: true, label: t("profiles.remove"), onClick: openRemoveProfile }),
    ], { foot: t("profiles.note") });
}
