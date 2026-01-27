# Build stage
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage with Caddy
FROM caddy:alpine
COPY --from=builder /app/dist /srv
COPY <<-"CADDYFILE" /etc/caddy/Caddyfile
:80 {
    root * /srv
    file_server
    try_files {path} /index.html
    
    handle /health {
        respond "ok" 200
    }
}
CADDYFILE
EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s CMD wget -q --spider http://localhost/health || exit 1
