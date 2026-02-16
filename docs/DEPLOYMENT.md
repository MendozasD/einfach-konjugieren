# Einfach Konjugieren — Deployment

## Architecture

```
konjugieren.aydavid.uk
  |- /* -> einfach_konjugieren (Caddy alpine, port 80)
  |- /api/* -> german_verbs_api (Node.js Express, port 3000)
               (strip_prefix /api)
```

Both containers on `caddy_network`. Outer Caddy on Contabo handles TLS + routing.

## Quick Deploy (SPA)

```bash
cd /home/cuervo/projects/einfach-konjugieren
docker compose build --no-cache
docker compose up -d --force-recreate
```

## Quick Deploy (API)

```bash
cd /home/cuervo/projects/german-verbs-api
docker compose build --no-cache
docker compose up -d --force-recreate
```

## Deploy from Local Machine

Use rsync, never scp:

```bash
# SPA
rsync -avz --delete --exclude=node_modules --exclude=.git --exclude=dist \
  /local/path/einfach-konjugieren/ contabo:/home/cuervo/projects/einfach-konjugieren/

# API
rsync -avz --delete --exclude=node_modules --exclude=.git \
  /local/path/german-verbs-api/ contabo:/home/cuervo/projects/german-verbs-api/
```

Then build and recreate on remote (see above).

## Verification

```bash
# 1. Capture pre-deploy bundle hash
curl -s https://konjugieren.aydavid.uk | grep -oP 'src="[^"]*\.js"'

# 2. Deploy (build --no-cache + up --force-recreate)

# 3. Verify bundle hash changed
curl -s https://konjugieren.aydavid.uk | grep -oP 'src="[^"]*\.js"'

# 4. Verify API responds
curl -s 'https://konjugieren.aydavid.uk/api/german-verbs-api/?verb=gehen'

# 5. Check container health
docker ps --filter name=einfach --filter name=german_verbs --format '{{.Names}} {{.Status}}'
```

## Important Rules

- **Always `--no-cache`** — Docker cache too aggressive with multi-stage builds
- **Always `--force-recreate`** — same image ID = no recreation without flag
- **Always verify bundle hash changed** — HTTP 200 does not mean new code is served
- **Never `scp -r`** — stale files persist, use `rsync --delete`

## Environment Variables

### API (.env)
- `PORT=3000` — Express listening port

## Docker Resources
- SPA: 128M memory, 0.25 CPU
- API: 512M memory, 0.5 CPU

## Caddy Config (outer)

In `/home/cuervo/docker/caddy_network/caddy/Caddyfile`:

```
konjugieren.aydavid.uk {
    import cloudflare
    @api path /api/*
    handle @api {
        uri strip_prefix /api
        reverse_proxy german_verbs_api:3000
    }
    handle {
        reverse_proxy einfach_konjugieren:80
    }
    header {
        X-Frame-Options "SAMEORIGIN"
    }
}
```

## Rollback

```bash
git log --oneline -5  # find the commit to roll back to
git checkout <commit>
docker compose build --no-cache
docker compose up -d --force-recreate
# Verify as above
git checkout main  # return to main after confirming
```
