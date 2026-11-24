// A learning profile is a pair of languages: from -> to. Topics, words and progress of a pair belong to it.
// Experience, streak, drops and settings are shared. Pure.
export const samePair = (a, b) => a.from === b.from && a.to === b.to;

// Every pair that is saved, current or used by a dictionary, without repeats.
export const listProfiles = (...lists) => lists.flat().reduce((list, { from, to }) =>
    (list.some((p) => samePair(p, { from, to })) ? list : [...list, { from, to }]), []);

// The topic that is learned now: the first one with words that are not started.
// When everything is started, the last one that has words.
export const currentTopic = (dictionaries) =>
    dictionaries.find((d) => d.words.some((w) => !w.srs)) ?? dictionaries.findLast((d) => d.words.length) ?? dictionaries[0];
