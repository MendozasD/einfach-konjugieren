# Code Audit — Einfach Konjugieren

**Date:** 2026-02-16
**Scope:** SPA (einfach-konjugieren) + API (german-verbs-api)
**Auditor:** Claude Code (code-audit skill)

## Project Overview

| | SPA (einfach-konjugieren) | API (german-verbs-api) |
|---|---|---|
| **Stack** | Vite + vanilla JS + SCSS | Express.js + german-verbs lib |
| **Modules** | 8 JS files, 1 SCSS | 6 source files, 3 test files |
| **Docker** | Multi-stage (Node builder → Caddy) | Node 22-alpine with healthcheck |
| **Tests** | None | Jest (but see finding #1) |
| **Lines** | ~800 JS + ~500 SCSS | ~350 source + ~200 test |

## Findings

| # | Category | Severity | File:Line | Finding | Effort | Status |
|---|----------|----------|-----------|---------|--------|--------|
| 1 | Operational | **Critical** | api/controllers/verbs.test.js (all) | All 9 route handler tests are vacuous — assertions wrapped in inner arrow functions that are never called. Zero effective test coverage. | Small | **FIXED** |
| 2 | Security | **High** | api/app.js:17 | `cors({ origin: "*" })` allows any domain to use the API | Small | **FIXED** |
| 3 | Security | **High** | spa/script/save_verb.js:20 | innerHTML with user-provided data (infinitive, conjugations) — XSS vector | Medium | **FIXED** |
| 4 | Security | **High** | spa/script/conjugator.js:31-60 | innerHTML with verb/conjugation data in template literals — XSS vector | Medium | **FIXED** |
| 5 | Architecture | **High** | api/controllers/verbs.js:67 | `var hasTense = hasAux = ...= true` chained assignment creates implicit globals | Small | **FIXED** |
| 6 | Security | Medium | api/app.js:20 | express.json({ type: "*/*" }) parses all content types as JSON | Small | **FIXED** |
| 7 | Security | Medium | api/package.json | express 4.17.1 is 4+ years old; missing security patches | Small | **FIXED** |
| 8 | Security | Medium | api/app.js | No rate limiting on any API endpoints | Medium | **FIXED** |
| 9 | Security | Medium | api/app.js | No helmet middleware for security headers | Small | **FIXED** |
| 10 | Security | Medium | api/app.js | No request body size limit (potential DoS) | Small | **FIXED** |
| 11 | Architecture | Medium | api/controllers/logger.js:23-26 | Dead code: POST and else branches both use req.body | Small | **FIXED** |
| 12 | Operational | Medium | api/controllers/logger.js | File-based logging to log.txt without rotation | Small | **FIXED** |
| 13 | DRY | Medium | spa save_verb.js + conjugator.js | Duplicated HTML card rendering logic | Medium | Open |
| 14 | Performance | Medium | spa/script/main.js:80 | Autocomplete input handler has no debounce | Small | **FIXED** |
| 15 | Operational | Medium | api/package.json | apicache 1.6.2 appears abandoned (last update 2022) | Medium | Open |
| 16 | DRY | Low | wallpaper.js, style.scss, pdf.js | Orange #ff5c36 defined in 3 separate places | Small | **Documented** |
| 17 | Architecture | Low | api/controllers/verbs.js:99 | conjugateArray calls errorHandler directly instead of as middleware | Small | **FIXED** |
| 18 | DRY | Low | api/controllers/verbs.js | Verb-missing validation check duplicated in 3 handlers | Small | **FIXED** |
| 19 | Performance | Low | spa/script/wallpaper.js:28 | External font re-fetched on every wallpaper generation | Small | **FIXED** |
| 20 | Operational | Low | both docker-compose.yml | No resource limits (memory/CPU) on containers | Small | **FIXED** |
| 21 | Operational | Low | SPA README.md | README is "congugation_present_app" — typo, no docs | Small | **FIXED** |
| 22 | Operational | Low | both projects | No CI/CD, no linting, no pre-commit hooks | Large | Open |
| 23 | Security | Low | api/.env | .env committed to server (PORT=3000, not sensitive) | Small | **FIXED** |

## Top 5 Priority Actions (all FIXED)

1. **#1 — Fix vacuous tests**: Removed inner `() => { ... }` wrappers so assertions execute.
2. **#3/#4 — Fix XSS vectors**: Replaced innerHTML with textContent/DOM API for user data.
3. **#5 — Fix implicit globals**: Changed chained var assignment to individual let declarations.
4. **#2 — Restrict CORS**: Changed `origin: "*"` to `"https://konjugieren.aydavid.uk"`.
5. **#7/#9/#10 — Security basics**: Updated express, added helmet, added body size limit, fixed JSON type.

## Summary Stats

```
Total findings: 23
By severity:  Critical: 1 | High: 4 | Medium: 9 | Low: 9
By category:  DRY: 3 | Architecture: 3 | Performance: 2 | Security: 8 | Project: 0 | Operational: 7
Fixed:        19 of 23
```
