// Test logic. Pure functions.
const shuffle = (list) => {
    const copy = [...list];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
};

// Case, punctuation and Latin accents do not matter.
export const normalize = (text) => text.toLowerCase().normalize("NFD")
    .replace(/([a-z])[̀-ͯ]+/g, "$1").normalize("NFC")
    .replace(/[.!?¡¿'’"«»()。！？]/g, "").replace(/\s+/g, " ").trim();

// "der Hund" -> "Hund". Works for the languages that use articles; "to go" -> "go".
export const stripArticle = (text) => text.replace(/^\s*(?:(?:the|an?|to|el|la|los|las|le|les|un|une|una|der|die|das|ein|eine|il|lo|i|gli)\s+|l['’])(?=\S)/i, "");

// The article and a note in brackets may be left out, but a wrong article is a mistake.
const variants = (text) => [text, ...text.split(/[,;/]/)]
    .flatMap((v) => [v, v.replace(/\s*\(.*?\)/g, "")])
    .flatMap((v) => [v, stripArticle(v)]).map(normalize).filter(Boolean);

// "el perro", 1 -> "el p••••"
export function hintMask(text, letters) {
    const base = text.replace(/\s*\(.*?\)/g, "");
    const rest = stripArticle(base);
    let left = letters;
    return base.slice(0, base.length - rest.length) + [...rest].map((c) => (!/[\p{L}\p{N}]/u.test(c) || left-- > 0 ? c : "•")).join("");
}

const sides = (word, reverse) => (reverse ? [word.translation, word.word] : [word.word, word.translation]);

export function buildQuiz(words, { count, reverse, only }) {
    return shuffle(only ? words.filter((w) => only.has(w.id)) : words).slice(0, count).map((word) => {
        const [prompt, answer] = sides(word, reverse);
        // Every answer of words with the same prompt is right.
        const accepted = words.filter((w) => normalize(sides(w, reverse)[0]) === normalize(prompt)).map((w) => sides(w, reverse)[1]);
        const taken = new Set(accepted.map(normalize));
        const wrong = [];
        for (const other of shuffle(words)) {
            const option = sides(other, reverse)[1];
            if (wrong.length < 3 && !taken.has(normalize(option))) {
                taken.add(normalize(option));
                wrong.push(option);
            }
        }
        return { wordId: word.id, prompt, answer, accepted, options: shuffle([answer, ...wrong]) };
    });
}

export const isCorrect = (question, text) =>
    normalize(text) !== "" && question.accepted.flatMap(variants).includes(normalize(text));
