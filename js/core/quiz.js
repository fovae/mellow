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

const variants = (text) => [text, ...text.split(/[,;/]/)].map(normalize).filter(Boolean);

const sides = (word, reverse) => (reverse ? [word.translation, word.word] : [word.word, word.translation]);

export function buildQuiz(words, { count, reverse }) {
    return shuffle(words).slice(0, count).map((word) => {
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
