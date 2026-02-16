# Einfach Konjugieren — Changelog

## 2026-02-16

### Security Hardening
- **XSS fix:** Replaced innerHTML with DOM API (createElement + textContent) in save_verb.js and conjugator.js
- **CORS:** Restricted from `origin: "*"` to `origin: "https://konjugieren.aydavid.uk"`
- **Helmet:** Added security headers middleware
- **Rate limiting:** 100 requests/min per IP via express-rate-limit
- **Body limit:** JSON payload capped at 100kb
- **Removed .env** from repository

### Performance
- **Debounce:** 150ms debounce on autocomplete input handler
- **Font caching:** Wallpaper generator caches Fontshare CSS after first load

### Architecture
- **Vacuous tests fixed:** Removed inner arrow function wrappers in verbs.test.js so assertions actually execute
- **Logger fixed:** Dead code (POST/else branches were identical), now uses appendFile, ISO timestamps
- **Docker resource limits:** SPA 128M/0.25 CPU, API 512M/0.5 CPU
- **Deduplicated validation** in controllers
- **Documented color cross-references** between CSS and JS

### Verbs Database Switch
- **Replaced** german-verbs-dict npm package (8423 verbs, runtime conjugation) with custom pre-computed verbs.json from kaikki/Wiktionary data (9846 verbs)
- **API response format changed:** strings instead of arrays (e.g. `"bin gegangen"` not `["bin", "gegangen"]`)
- **Tenses:** 6 indicative only (removed Konjunktiv tenses)
- **verbFinder.js** completely rewritten as simple JSON lookup
- **controllers/verbs.js** simplified from ~140 to ~50 lines
- **Umlaut handling:** Lookup prefers ß forms (heißen over heissen), removed 133 Swiss-German duplicates
- **SPA formatConjugation** updated to handle both string and array formats

### Infrastructure
- Created Gitea repos for both SPA and API
- Git credential helper configured on Contabo (scoped to gitea.aydavid.uk)
