# Server: accounts and the cloud copy

The app and its API run as one Cloudflare Worker on one origin: static files from the repository root, `/api/*` from `server/`.
No build step. An account is required: the sign-in screen comes first whenever the server answers.
Without an answer (offline at the first start, or plain static hosting) the app starts without it.

## How it works

- Sign-in: nickname (`[a-z0-9_]`, 3–20, case-insensitive) and password. No email.
- The password never leaves the device: `js/core/account.js` turns it into a key with PBKDF2-SHA256, 600,000 rounds, salt = nickname.
  The server stores `HMAC-SHA256(PEPPER, random salt + key)`. `PEPPER` is a Worker secret, so a copy of the database alone is not enough to test passwords.
- Recovery code (80 bits, shown once): sets a new password, gives a new code, signs out every device.
- Session: random 256-bit token in a cookie `__Host-mellow; Secure; HttpOnly; SameSite=Strict`, 180 days; the database keeps only its SHA-256. Up to 10 sessions per user.
- Changing requests must have `Origin` of the site itself (and `Sec-Fetch-Site: same-origin` when sent): no CSRF.
- Backup: gzip of the same JSON as the backup file, up to 600 KB. The server keeps the last copy and the one before. Saving: the button, or by itself every 7 days when the app is opened, only on a device that has saved or loaded this account's copy (an empty new device never replaces the cloud copy by itself).
- After signing in, a cloud copy newer than this device has seen loads by itself on an empty device and is offered otherwise.
- A new profile (after the first screen) is saved at once. Signing out saves first, then clears the device; deleting the account clears it too.
- Limits: 10 sign-in attempts per minute per IP and per nickname, 3 saves per minute and 20 per day per user;
  for the whole service a day: 1000 sign-ups, 5000 sign-ins, 20,000 saves. Worst case about 53,000 written rows, under D1's free 100,000.
- Static files get CSP, HSTS, `frame-ancestors 'none'`, `Permissions-Policy: microphone=()` and more from `_headers`. `.assetsignore` keeps `server/`, tests and configs off the site.

API: `POST /api/signup | login | logout | recover | password | recovery-code`, `GET /api/me`, `PUT|GET /api/backup` (`?which=previous`), `DELETE /api/account`.

## First deploy (once)

Live: https://mellow.fovae.workers.dev (D1 "mellow", region WEUR). Steps below were done on 2026-11-26.

1. Create a free Cloudflare account; install Node 22+.
2. `npx wrangler login`
3. `npx wrangler d1 create mellow` and put the printed `database_id` into `wrangler.jsonc`.
4. `npx wrangler d1 execute mellow --remote --file=server/schema.sql`
5. `openssl rand -hex 32 | npx wrangler secret put PEPPER` — keep a copy in a password manager: if it is lost, every password stops working (recovery codes too).
6. `npx wrangler deploy` — the site is at `https://mellow.<account>.workers.dev`; a custom domain can be added in the dashboard.

Then deploy again after each change: `npx wrangler deploy`.

## Local run

```bash
printf 'PEPPER=%s\nDEV_HTTP_COOKIE=1\n' "$(openssl rand -hex 32)" > .dev.vars   # never commit; DEV_HTTP_COOKIE only for http://localhost
npx wrangler d1 execute mellow --local --file=server/schema.sql
npx wrangler dev                       # http://localhost:8787
```

Tests: `node --test tests/*.mjs` (the API on node:sqlite), and with `wrangler dev` running:
`cd tests/e2e && MELLOW_URL=http://localhost:8787/ BROWSER=webkit node --test account.test.mjs`.

## Not done yet

- Sign in with Google (needs a Google Cloud client ID) and Apple (needs the paid Apple Developer Program).
- Turnstile on sign-up (needs a Turnstile site key): today mass sign-ups are only held by the per-IP limit and the daily cap.
- Backups are not encrypted with the password; they are readable on the server.
