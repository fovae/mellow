# Architecture

```text
index.html      shell: loader, <main>, tab bar
sw.js           offline cache (network first)
css/            base (tokens, fonts), loader, layout, components
js/main.js      boot
js/core/        store, srs, quiz, dates, i18n, theme, speech, dom, activity, viewport
js/ui/          navigation, modal, dictionary modals, icons, scrollbar, loader, onboarding,
                hero, parts (shared blocks), study, test-session
js/screens/     one render function per tab
js/data/        starter dictionaries, study languages
js/i18n/        interface translations
tests/          node --test tests/*.mjs
```

## Data flow

1. UI calls an action in `core/store.js`.
2. The action changes the state, saves it and notifies subscribers with a type.
3. `main.js` re-renders the current screen. Other screens render when opened.

Never write to localStorage or mutate state outside the store.

## State (`localStorage.mellow_state`)

```text
version (2), username, activeDictionaryId, totalTimeActive (seconds)
settings: language, theme, dailyGoal, newPerDay, reverse
log["YYYY-MM-DD"]: answers, correct, fresh, seconds
dictionaries[]: id, name, description, emoji, from, to
  words[]: id, word, translation, isFavourite
    srs: null | { due, interval (days), ease, step, lapses }
```

When this shape changes, raise `VERSION` and add a step to `migrations` in the store.

## Spaced repetition

`core/srs.js` is pure and based on SM-2. New words: two "good" answers (10 minutes, then 1 day) or one "easy" (4 days).
Then the interval grows by `ease`; "again" returns the word to learning. Intervals of 21+ days count as mastered.
A wrong test answer makes a word that is already in study due now; right test answers do not move the schedule.

## Rules

- Build DOM with `h()`. Do not use `innerHTML`: user text must stay text.
- All interface text goes through `t()`, in every file of `js/i18n/`.
- Every modal uses `openModal()`.
- When adding, removing or renaming a file, update `ASSETS` and the version in `sw.js`.
