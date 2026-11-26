// Shared shortcuts used by several screens.
import { getDifficult, getQuizSources, getScopeQueue } from "../core/store.js";
import { openStudy } from "./study.js";
import { openTest } from "./test-session.js";
import { openMyWords } from "./dictionary-modals.js";

// Everything that is due in the profile and the next new words.
export const studyAll = () => openStudy(null);

export const countAll = () => {
    const { due, soon, fresh } = getScopeQueue(null);
    return due.length + soon.length + fresh.length;
};

export const trainDifficult = () => openTest(getQuizSources(getDifficult()), { mode: "choice", reverse: false, count: 20 });

// A new word goes to "My words": the topic opens with the field ready.
export const quickAdd = () => openMyWords({ add: true });
