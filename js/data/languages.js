const languages = {
    English: ["en", "🇬🇧"], Spanish: ["es", "🇪🇸"], French: ["fr", "🇫🇷"], German: ["de", "🇩🇪"], Italian: ["it", "🇮🇹"],
    Portuguese: ["pt", "🇵🇹"], Dutch: ["nl", "🇳🇱"], Polish: ["pl", "🇵🇱"], Ukrainian: ["uk", "🇺🇦"], Russian: ["ru", "🇷🇺"],
    Turkish: ["tr", "🇹🇷"], Japanese: ["ja", "🇯🇵"], Korean: ["ko", "🇰🇷"], Chinese: ["zh", "🇨🇳"],
};

export const studyLanguages = Object.keys(languages);
export const languageCode = (name) => languages[name]?.[0] ?? "en";
export const languageFlag = (name) => languages[name]?.[1] ?? "📚";
export const languageName = (name, locale) => {
    const text = new Intl.DisplayNames([locale], { type: "language" }).of(languageCode(name));
    return text.charAt(0).toUpperCase() + text.slice(1);
};
export const dictionaryIcons = [...studyLanguages.map(languageFlag), "📚", "🌍", "🗣️", "💬", "🎓", "✨", "🚀"];
