# Code Audit — Einfach Konjugieren

**Date:** 2026-02-16
**Scope:** SPA (einfach-konjugieren) + API (german-verbs-api)
**Auditor:** Claude Code (code-audit skill)

## Project Overview

| | SPA (einfach-konjugieren) | API (german-verbs-api) |
|---|---|---|
| **Stack** | Vite + vanilla JS + SCSS | Express.js + kaikki/Wiktionary verbs.json |
| **Modules** | 8 JS files, 1 SCSS | 6 source files, 3 test files |
| **Docker** | Multi-stage (Node builder -> Caddy) | Node 22-alpine with healthcheck |
| **Tests** | None | Jest (vacuous tests fixed, see #1) |
| **Lines** | ~800 JS + ~500 SCSS | ~200 source + ~200 test |

## Findings

| # | Category | Severity | File:Line | Finding | Effort | Status |
|---|----------|----------|-----------|---------|--------|--------|
| 1 | Operational | **Critical** | api/controllers/verbs.test.js (all) | All 9 route handler tests were vacuous — assertions wrapped in inner arrow functions never called. Zero effective test coverage. | Small | **FIXED** |
| 2 | Security | **High** | api/app.js:17 | `cors({ origin: "*" })` allowed any domain to use the API | Small | **FIXED** — restricted to konjugieren.aydavid.uk |
| 3 | Security | **High** | spa/script/save_verb.js:20 | innerHTML with user-provided data (infinitive, conjugations) — XSS vector | Medium | **FIXED** — replaced with createElement + textContent |
| 4 | Security | **High** | spa/script/conjugator.js:31-60 | innerHTML with verb/conjugation data in template literals — XSS vector | Medium | **FIXED** — replaced with DocumentFragment + DOM API |
| 5 | Architecture | **High** | api/controllers/verbs.js:67 | `var hasTense = hasAux = ...= true` chained assignment created implicit globals | Small | **FIXED** — entire controller rewritten during verbs DB switch |
| 6 | Security | Medium | api/app.js:20 | express.json({ type: "*/*" }) parsed all content types as JSON | Small | **FIXED** — removed type override |
| 7 | Security | Medium | api/package.json | express 4.17.1 was 4+ years old; missing security patches | Small | **FIXED** — resolved to 4.22.1 (latest 4.x). Express 5 upgrade deferred (breaking changes). |
| 8 | Security | Medium | api/app.js | No rate limiting on any API endpoints | Medium | **FIXED** — express-rate-limit, 100 req/min per IP |
| 9 | Security | Medium | api/app.js | No helmet middleware for security headers | Small | **FIXED** — helmet added |
| 10 | Security | Medium | api/app.js | No request body size limit (potential DoS) | Small | **FIXED** — 100kb JSON limit |
| 11 | Architecture | Medium | api/controllers/logger.js:23-26 | Dead code: POST and else branches both used req.body | Small | **FIXED** — logger rewritten with structured format |
| 12 | Operational | Medium | api/controllers/logger.js | File-based logging to log.txt without rotation | Small | **FIXED** — structured format with ISO timestamps, appendFile |
| 13 | DRY | Medium | spa save_verb.js + conjugator.js | Duplicated HTML card rendering logic | Medium | Open — only 2 call sites, abstraction would be premature |
| 14 | Performance | Medium | spa/script/main.js:80 | Autocomplete input handler had no debounce | Small | **FIXED** — 150ms debounce |
| 15 | Operational | Medium | api/package.json | apicache 1.6.2 appears abandoned (last update 2022) | Medium | Open — needs evaluation of alternatives |
| 16 | DRY | Low | wallpaper.js, style.scss, pdf.js | Orange #ff5c36 defined in 3 separate places | Small | **Documented** — cross-references added as comments |
| 17 | Architecture | Low | api/controllers/verbs.js:99 | conjugateArray called errorHandler directly instead of as middleware | Small | **FIXED** — eliminated during verbs DB switch (controller rewritten) |
| 18 | DRY | Low | api/controllers/verbs.js | Verb-missing validation check duplicated in 3 handlers | Small | **FIXED** — eliminated during verbs DB switch (controller rewritten) |
| 19 | Performance | Low | spa/script/wallpaper.js:28 | External font re-fetched on every wallpaper generation | Small | **FIXED** — fontsLoaded flag caches after first load |
| 20 | Operational | Low | both docker-compose.yml | No resource limits (memory/CPU) on containers | Small | **FIXED** — SPA: 128M/0.25 CPU, API: 512M/0.5 CPU |
| 21 | Operational | Low | SPA README.md | README was "congugation_present_app" — typo, no docs | Small | **FIXED** — README rewritten with features, stack, deploy guide |
| 22 | Operational | Low | both projects | No CI/CD, no linting, no pre-commit hooks | Large | Open — separate initiative |
| 23 | Security | Low | api/.env | .env committed to server (PORT=3000, not sensitive) | Small | **FIXED** — removed from repo |

## Top 5 Priority Actions (all FIXED)

1. **#1 — Fix vacuous tests**: Removed inner `() => { ... }` wrappers so assertions execute.
2. **#3/#4 — Fix XSS vectors**: Replaced innerHTML with textContent/DOM API for user data.
3. **#5 — Fix implicit globals**: Changed chained var assignment to individual let declarations. Later eliminated entirely by controller rewrite.
4. **#2 — Restrict CORS**: Changed `origin: "*"` to `"https://konjugieren.aydavid.uk"`.
5. **#7/#9/#10 — Security basics**: Express resolved to 4.22.1, added helmet, body size limit 100kb, fixed JSON type.

## Verbs DB Switch (same day)

After the audit fixes, the API was fully rewritten to replace the german-verbs-dict npm package with a custom pre-computed verbs.json database (9846 verbs from kaikki/Wiktionary). This rewrite permanently resolved several findings:

- **#5** (implicit globals) — controller completely rewritten, no chained assignments
- **#17** (errorHandler misuse) — errorHandler removed, simplified routes
- **#18** (duplicated validation) — controller reduced from ~140 to ~50 lines

Files rewritten: `verbFinder.js`, `controllers/verbs.js`, `routes/verbs.js`, `package.json` (removed german-verbs deps).

## Summary Stats

```
Total findings: 23
Fixed:          19
Documented:      1  (#16 color cross-references)
Open:            3  (#13 DRY card rendering, #15 apicache replacement, #22 CI/CD)

By severity:  Critical: 1 | High: 4 | Medium: 9 | Low: 9
By category:  DRY: 3 | Architecture: 3 | Performance: 2 | Security: 8 | Project: 0 | Operational: 7
```
