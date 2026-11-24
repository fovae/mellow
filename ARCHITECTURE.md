# Architecture

```text
index.html      shell: loader, <main>, tab bar
sw.js           offline cache (network first)
css/            base (tokens, fonts), themes (colour styles), loader, layout, components, play, cells, widgets, art, legal
js/main.js      boot
js/core/        store, srs, quiz, games, lessons, rewards, accents, sound, library, transfer, advice, achievements, dates, i18n, theme, speech, dom, activity, viewport
js/ui/          navigation, modal, cells (grouped lists), art (pictures), widgets (home), stats, dictionary modals, icons, scrollbar, loader, onboarding,
                hero, parts (shared blocks), study, exercises, test-session, games, lesson, path,
                rewards (quests, level, shop), mascot, toast, dropdown, library-modal, transfer-modals,
                files, actions (shortcuts)
js/screens/     one render function per tab
js/data/        library (33 topics, 6 languages, lazy), study languages
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
version (5), username, totalTimeActive (seconds), profiles[] { from, to }, removedTopics[]
settings: language, theme, dailyGoal, newPerDay, reverse, autoSpeak, sound, haptics, speechRate, motion, backupReminder, accent, native, target
lastBackup (ms), records { pairs: seconds, sprint: score }
drops, freezes, frozen["YYYY-MM-DD"], owned[], quests { day, done[] }, rewardedLevel
log["YYYY-MM-DD"]: see emptyDay() in core/rewards.js
dictionaries[]: id, name, description, emoji, from, to, libraryKey?
  words[]: id, word, translation, isFavourite, example?, misses?
    srs: null | { due, interval (days), ease, step, lapses }
```

When this shape changes, raise `VERSION` and add a step to `migrations` in the store.

## Spaced repetition

`core/srs.js` is pure and based on SM-2. New words: two "good" answers (10 minutes, then 1 day) or one "easy" (4 days).
Then the interval grows by `ease`; "again" returns the word to learning. Intervals of 21+ days count as mastered.
A wrong test answer makes a word that is already in study due now; right test answers do not move the schedule.

## Play

- The path is built from any dictionary (`core/lessons.js`). It stores nothing: progress comes from the words.
- Experience is the sum of `log[day].xp`. Quests, the daily goal and levels are checked in `commit()`; rewards arrive by themselves.
- A streak freeze is spent automatically (`protectStreak`). There are no lives: mistakes only bring words back.
- Menus and settings are grouped lists: `group()` and `cell()` from `ui/cells.js`. One scrolling list, no nested screens: long choices open as sheets.
- The home screen is a grid of widgets (`ui/widgets.js`): wide or square, squares go in pairs. The main button always starts the mixed review.
- A profile is a pair of languages (`core/profiles.js`); the current one is `settings.native -> settings.target`. Use `getDictionaries()`, not `getState().dictionaries`, for anything that is shown.
- There is no active dictionary: the dictionaries of a profile are a course in order. `getCurrentTopic()` is the first with unstarted words, `learnFirst()` moves a topic to the beginning, `continueCourse()` adds the next library topic.
- Emoji never reach the screen: they are names of pictures in `ui/art.js`. A new emoji in the data needs a picture, the tests check it.
- A switch saves with `updateSettings(changes, "switch")`, so the screen is not redrawn under it.
- Use `choiceCell()` in lists and `dropdown()` in forms instead of `<select>`, `toast()` for messages, `mascot()` for empty and final screens.
- A new colour style: `core/accents.js`, `css/themes.css`, two texts. The tests check contrast.

## Automation

- `getScopeWords(null)` is the mixed review: all words of the current profile, new ones topic by topic.
- `misses` grows on a wrong answer and falls on a right one; from 2 a word is "difficult".
- To add vocabulary, add lines to `data/library.js`. The tests check columns and duplicates.

## Rules

- Build DOM with `h()`. Do not use `innerHTML`: user text must stay text.
- All interface text goes through `t()`, in every file of `js/i18n/`.
- Every modal uses `openModal()`.
- Data from files goes through `core/transfer.js` (`parseWords`, `cleanState`) before it reaches the store. A new state field must be added to `cleanState` too.
- Files are saved and picked through `ui/files.js`.
- When adding, removing or renaming a file, update `ASSETS` and the version in `sw.js`.
