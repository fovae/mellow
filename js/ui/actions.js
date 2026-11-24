// Shared shortcuts used by several screens.
import { getActiveDictionary, getDifficult, getQuizSources, getScopeQueue } from "../core/store.js";
import { openStudy } from "./study.js";
import { openTest } from "./test-session.js";
import { openLibrary } from "./library-modal.js";
import { openWordForm } from "./dictionary-modals.js";

// Everything that is due, in all dictionaries. New words come only from the active one.
export const studyAll = () => openStudy(null);

export const countAll = () => {
    const { due, soon, fresh } = getScopeQueue(null);
    return due.length + soon.length + fresh.length;
};

export const trainDifficult = () => openTest(getQuizSources(getDifficult()), { mode: "choice", reverse: false, count: 20 });

export function quickAdd() {
    const dict = getActiveDictionary();
    return dict ? openWordForm(dict.id) : openLibrary();
}
