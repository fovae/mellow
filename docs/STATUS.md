# Status

## Works

Learning profiles (one language pair at a time, switched in settings), a course of topics that continues by itself, learning path and lessons for every topic, experience, levels, daily quests, drops, shop, streak freeze, 8 colour styles,
mascot, sounds. Splash where Mello wakes up, one-page first screen (name, languages, pace, restore) with automatic first topics, library (33 topics, 756 words, 86 examples, 6 languages in any direction),
topics of the course and one "My words" topic, each in one sheet with adding a word in place (search, speech, examples, translation suggestions), spaced repetition with undo, swipes,
hints and keyboard, mixed review, difficult words, tests (choice, typing, listening, hints), games (pairs, phrase, sprint), advice, word and tip of the day,
achievements, daily goal, streak, statistics, grouped settings (languages, sounds, speech speed, animations, backup reminder), light/dark/auto theme, EN/RU, offline, icon badge. No files at all: copies live only in the account.
Guide in stories after the first screen (and from Profile). Required account (sign-in screen first: nickname and password, recovery code) with a cloud copy: by the button, after the first screen, before signing out and every 7 days; loads by itself on another device; Cloudflare Worker + D1 (docs/SERVER.md). Live at https://mellow.fovae.workers.dev.

## Next candidates

- Accounts: deploy to Cloudflare (docs/SERVER.md), then Google sign-in, Turnstile on sign-up; Apple sign-in with the App Store
- App Store and Google Play: postponed
- Feedback from a real iPhone on the splash and the first screen (keyboard), and on 0.14.0: sheets closed with a swipe, the moving background, pictures, the new icon
- Widgets arranged by the user: move, hide, change size (offered, not decided)
- Names of library topics follow the interface language (now they keep the language they were added in)
- More topics and languages of the library; vocabulary should be proofread by native speakers
- Notifications (needs a server on iOS)
- Legal review of privacy.html and terms.html

## Not verified

WebKit engine passes the browser tests. A real iPhone is not checked: gestures, speech voices, safe areas, installed mode, share sheet, icon badge.
