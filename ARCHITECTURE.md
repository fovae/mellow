# Architecture

```text
index.html      shell: loader, <main>, tab bar
sw.js           offline cache (network first)
css/            base (tokens, fonts), loader, layout, components
js/main.js      boot
js/core/        store, i18n, dom, activity, viewport
js/ui/          navigation, modal, dictionary modals, icons, scrollbar, loader, onboarding
js/screens/     one render function per tab
js/data/        starter dictionaries, study languages
js/i18n/        interface translations
```

## Data flow

1. UI calls an action in `core/store.js`.
2. The action changes the state, saves it and notifies subscribers with a type.
3. `main.js` re-renders the current screen. Other screens render when opened.

Never write to localStorage or mutate state outside the store.

## State (`localStorage.mellow_state`)

```text
version, username, settings.language, activeDictionaryId, totalTimeActive (seconds)
dictionaries[]: id, name, description, emoji, from, to
  words[]:      id, word, translation, isFavourite, learned
```

Progress is always computed from `learned`. Changing this shape requires a new `VERSION` and a migration:
without one, data of an older version is replaced by the defaults.

## Rules

- Build DOM with `h()`. Do not use `innerHTML`: user text must stay text.
- All interface text goes through `t()`, in every file of `js/i18n/`.
- Every modal uses `openModal()`.
- When adding, removing or renaming a file, update `ASSETS` and the version in `sw.js`.
