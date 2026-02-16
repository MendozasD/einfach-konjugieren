# Einfach Konjugieren

German verb conjugation practice app. Search any of ~8000 verbs and see all indicative tense conjugations. Save verbs to a personal list, export as PDF or phone wallpaper.

**Live:** https://konjugieren.aydavid.uk

## Stack

- **Frontend:** Vite + vanilla JS + SCSS
- **API:** [german-verbs-api](../german-verbs-api/) (Express.js)
- **Deploy:** Docker (multi-stage: Node builder → Caddy) on caddy_network

## Development

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```
