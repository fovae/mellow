// Pure: numbers in, badges out.
const list = [
    ["first", "🌱", "answers", 1], ["hundred", "💯", "answers", 100], ["thousand", "🚀", "answers", 1000],
    ["streak3", "🔥", "streak", 3], ["streak7", "⚡", "streak", 7], ["streak30", "🏅", "streak", 30],
    ["mastered10", "⭐", "mastered", 10], ["mastered100", "🌟", "mastered", 100], ["mastered500", "👑", "mastered", 500],
    ["words200", "📚", "words", 200], ["goals5", "🎯", "goals", 5], ["sharp", "🦉", "sharp", 1],
];

// Longest run of days with answers, so a badge is not lost when a streak ends.
export function bestStreak(log) {
    let best = 0;
    let run = 0;
    let previous = null;
    for (const key of Object.keys(log).filter((k) => log[k].answers > 0).sort()) {
        const [y, m, d] = key.split("-").map(Number);
        const day = Date.UTC(y, m - 1, d) / 86400000;
        run = previous !== null && day === previous + 1 ? run + 1 : 1;
        best = Math.max(best, run);
        previous = day;
    }
    return best;
}

export function getAchievements({ log, mastered, words, dailyGoal }) {
    const days = Object.values(log);
    const values = {
        answers: days.reduce((sum, d) => sum + d.answers, 0),
        streak: bestStreak(log),
        mastered, words,
        goals: days.filter((d) => d.answers >= dailyGoal).length,
        sharp: days.some((d) => d.answers >= 20 && d.correct === d.answers) ? 1 : 0,
    };
    return list.map(([id, emoji, key, goal]) => ({ id, emoji, goal, value: Math.min(goal, values[key]), done: values[key] >= goal }));
}
