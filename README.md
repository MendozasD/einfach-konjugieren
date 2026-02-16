# Einfach Konjugieren

German verb conjugation practice app. Search any of 9846 verbs and see all 6 indicative tense conjugations. Save verbs to a personal list, export as PDF or phone wallpaper.

**Live:** https://konjugieren.aydavid.uk

## Features

- Search with autocomplete (umlaut-tolerant: muessen finds the correct verb)
- Conjugation cards for all 6 indicative tenses
- Save conjugations to a personal list (deduped)
- Export as PDF (A4 tables)
- Export as phone wallpaper (1080x1920 AMOLED PNG)

## Stack

- **Frontend:** Vite + vanilla JS + SCSS
- **API:** [german-verbs-api](../german-verbs-api/) (Express.js, 9846 verbs from kaikki/Wiktionary)
- **Deploy:** Docker (multi-stage: Node builder -> Caddy alpine) on caddy_network

## Development

```bash
npm install
npm run dev
```

## Deploy

```bash
docker compose build --no-cache
docker compose up -d --force-recreate
```

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment guide.
