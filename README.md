# Mellow

A minimalist offline vocabulary PWA. Plain HTML, CSS and JavaScript (ES modules): no build step, no dependencies.

## Run

```bash
python3 -m http.server 8000
```

Open http://localhost:8000. ES modules do not work from `file://`.

Unit tests: `node --test tests/*.mjs`.
Browser tests: `cd tests/e2e && npm ci && npx playwright install chromium webkit && BROWSER=webkit npm test`.

## Documentation

- [ARCHITECTURE.md](ARCHITECTURE.md): how the code is organised
- [docs/STATUS.md](docs/STATUS.md): what works, what was removed, what is next
- [docs/SERVER.md](docs/SERVER.md): accounts, the cloud copy, deploying to Cloudflare

## License

All rights reserved. The Manrope font in `fonts/` is licensed under the SIL Open Font License (`fonts/OFL.txt`).
