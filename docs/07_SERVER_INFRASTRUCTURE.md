# Server Infrastructure

## Host

- **Server IP:** `89.169.39.244`
- **Domain:** `crm.al.siteaccess.ru`
- **OS shell used in ops:** root SSH + PM2 + Nginx

## Directories

- Web root (frontend build output): `/var/www/ai-gateway/dist`
- Backend runtime: `/var/www/ai-gateway/backend`
- Logs: `/var/www/ai-gateway/logs`
- Build + git working tree used for synchronization: `/tmp/fluid-orb-talk-build`

## Nginx Topology

Config reference in repo: `nginx-crm.conf`

- `/` -> SPA static root (`/var/www/ai-gateway/dist`)
- `/auth/` -> proxied to backend `http://127.0.0.1:5000`
- `/gateway/` -> proxied to backend `http://127.0.0.1:5000/`
- Existing unrelated API paths (`/api`, `/v1`, `/health`, `/metrics`) proxy to `:4100`

Security headers reference: `nginx-security-headers.conf`

## Process Management

- PM2 process used for backend: `ai-gateway-new`
- Runtime script: `/var/www/ai-gateway/backend/dist/index.js`

## Services

- PostgreSQL: main persistence for auth/conversations/messages/usage logs
- Redis: distributed rate limiting backend (`REDIS_URL`)

## Source-of-Truth Note

Operationally, production code runs from `/var/www/ai-gateway/*`.
For git synchronization workflows, `/tmp/fluid-orb-talk-build` is used as server git working tree.

