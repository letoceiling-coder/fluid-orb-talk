# VPS Infrastructure Audit — 89.169.39.244

**Audit date:** 2026-03-15  
**Purpose:** Prepare safe deployment of AI Gateway Platform (fluid-orb-talk) to `/var/www/ai-gateway` under domain `crm.al.siteaccess.ru`  
**Constraint:** Existing project at `/var/www/ai-platform` must NOT be deleted or modified

---

## 1. Server Environment

| Parameter | Value |
|-----------|-------|
| IP | 89.169.39.244 |
| OS | Ubuntu (Beget VPS) |
| Node.js | v20.20.0 |
| npm | 10.8.2 |
| PM2 | 6.0.14 |
| PHP | 8.3 (FPM) |
| MySQL | Community Server (port 3306, localhost only) |
| PostgreSQL | port 5432, localhost only |
| Redis | port 6379, localhost only |
| Nginx | active, ports 80 / 443 / 8080 |

---

## 2. Disk Usage

| Filesystem | Size | Used | Available | Use% |
|-----------|------|------|-----------|-----|
| /dev/vda1 (root) | 77G | **38G** | 40G | **49%** |
| /boot | 881M | 117M | 703M | 15% |

**Project sizes in /var/www:**

| Directory | Size |
|-----------|------|
| html | 8.0K |
| _letsencrypt | 16K |
| tesseract-api | 24K |
| essens-store.ru | 6.3M |
| ai-hub-backend | 44M |
| parser-traidagent | 127M |
| p-d-a-b.neeklo.ru | 150M |
| admin.neeklo.ru | 157M |
| trend-api | 264M |
| image-to-text-bot | 298M |
| AL | 327M |
| parser-tg-frontend | 356M |
| al.siteaccess.ru | 392M |
| msk.proffi-center.ru | 426M |
| proffi-center | 437M |
| messenger | 494M |
| online.siteaccess.ru | 661M |
| **ai-platform** | **686M** ← current crm.al.siteaccess.ru backend |
| auto.siteaccess.ru | 817M |
| messager | 994M |
| parser-tg | 1.2G |

> **Available space: 40G** — sufficient for the new project

---

## 3. Running Nginx Domains

| Config file | Domain | Root directory | Backend port |
|-------------|--------|---------------|-------------|
| `al.siteaccess.ru` | al.siteaccess.ru | `/var/www/al.siteaccess.ru/dist` | :3001 (socket.io + api) |
| `api.siteaccess.ru` | api.siteaccess.ru | `/var/www/AL/public` | PHP 8.3 FPM |
| `auto.siteaccess.ru` | auto.siteaccess.ru | `/var/www/auto.siteaccess.ru/public` | PHP 8.3 FPM |
| `crm.al.siteaccess.ru` | crm.al.siteaccess.ru | `/var/www/ai-platform/apps/web/dist` | :4100 (Node.js) |
| `messager` | (messenger app) | `/var/www/messager/chat-hub-design/dist` | — |
| `msk.proffi-center.ru` | msk.proffi-center.ru | `/var/www/msk.proffi-center.ru/frontend/dist` | — |
| `admin.neeklo.ru` | admin.neeklo.ru | — | — |
| `essens-store.ru` | essens-store.ru | — | — |
| `online.siteaccess.ru` | online.siteaccess.ru | — | — |
| `parser-tg.siteaccess.ru` | parser-tg.siteaccess.ru | — | — |
| `proffi-center.ru` | proffi-center.ru | — | — |
| `trendagent.siteaccess.ru` | trendagent.siteaccess.ru | — | — |

---

## 4. Current `crm.al.siteaccess.ru` Config (FULL)

```nginx
server {
    listen 80;
    server_name crm.al.siteaccess.ru;

    location /api/ {
        proxy_pass http://127.0.0.1:4100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /v1/ {
        proxy_pass http://127.0.0.1:4100;
    }

    location /metrics {
        proxy_pass http://127.0.0.1:4100;
    }

    location /health {
        proxy_pass http://127.0.0.1:4100;
    }

    location / {
        root /var/www/ai-platform/apps/web/dist;   # ← CURRENT FRONTEND ROOT
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 443 ssl;
    server_name crm.al.siteaccess.ru;
    ssl_certificate /etc/letsencrypt/live/crm.al.siteaccess.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.al.siteaccess.ru/privkey.pem;

    # ... same locations as :80 block
    location / {
        root /var/www/ai-platform/apps/web/dist;   # ← CURRENT FRONTEND ROOT
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

**Key facts:**
- Frontend root: `/var/www/ai-platform/apps/web/dist`
- Backend: Node.js process (PID 769207) listening on **:4100**
- SSL: Let's Encrypt certificate already exists for this domain

---

## 5. PM2 Processes

| ID | Name | PID | Port | Uptime | Restarts | Memory |
|----|------|-----|------|--------|---------|--------|
| 4 | `ai-gateway` | 769207 | :4100 | 13h | 99 | 87.4 MB |
| 3 | `ai-workers` | 743328 | — | 15h | 1 | 49.6 MB |
| 0 | `messenger-api` | 354518 | :30000 | 7 days | 14 | 36.3 MB |

> **Note:** PM2 process `ai-gateway` (ID 4) is the current backend for `crm.al.siteaccess.ru`. It runs from `/var/www/ai-platform/apps/api/dist/src/main.js` on port **4100**.

---

## 6. All Node.js Processes

| PID | Path | Port | User |
|-----|------|------|------|
| 1317 | `/var/www/online.siteaccess.ru/apps/server/dist/main.js` | :3100 | root |
| 354518 | `/var/www/messager/backend/dist/src/main.js` | :30000 | root |
| 560841 | `/var/www/al.siteaccess.ru/server/index.mjs` | :3001 | www-data |
| 743328 | `/var/www/ai-platform/apps/workers/src/main.js` | — | root |
| 769207 | `/var/www/ai-platform/apps/api/dist/src/main.js` | :4100 | root |

---

## 7. All Systemd Services (Running)

| Service | Description |
|---------|-------------|
| `nginx.service` | Web server |
| `mysql.service` | MySQL Community Server |
| `php8.3-fpm.service` | PHP 8.3 FastCGI |
| `pm2-root.service` | PM2 process manager |
| `redis-server.service` | Redis key-value store |
| `supervisor.service` | Supervisor process control |
| `reverb.service` | Laravel Reverb WebSocket |
| `ai-hub-api.service` | AI Hub Laravel API |
| `al-siteaccess-api.service` | al.siteaccess.ru Vision API |
| `online-siteaccess.service` | Online SiteAccess Chat |
| `neeklo-bot.service` | Neeklo Telegram Bot |
| `telegram-bot-webhook.service` | Image-to-Text Bot Webhook |
| `trend-api-queue.service` | TrendAgent Laravel queue |
| `coturn.service` | STUN/TURN server |
| `3proxy.service` | Proxy server |
| `fail2ban.service` | Intrusion prevention |
| `ssh.service` | SSH server |

---

## 8. Open Ports

| Port | Service | Process |
|------|---------|---------|
| 22 | SSH | sshd |
| 80 | HTTP | nginx |
| 443 | HTTPS | nginx |
| 3128 | Proxy | 3proxy |
| 3478 / 5349 | STUN/TURN | coturn |
| 6001 | WebSocket | PHP Reverb |
| 8080 | HTTP alt | nginx |
| 8088 / 8443 | HTTP/HTTPS | python |
| **:3001** | al.siteaccess.ru API | node (www-data) |
| **:3100** | online.siteaccess.ru | node (root) |
| **:4100** | ai-platform API | node / PM2 |
| **:30000** | messenger API | node / PM2 |
| 127.0.0.1:3306 | MySQL | mysqld |
| 127.0.0.1:5432 | PostgreSQL | postgres |
| 127.0.0.1:6379 | Redis | redis |
| 127.0.0.1:8000 | PHP FPM | php8.3 |

> **Free ports for new project:** :3500, :3600, :4200, :5000 (any not listed above)
> **Recommended for ai-gateway backend:** **:5000**

---

## 9. MySQL Databases

| Database | Charset | Collation |
|----------|---------|-----------|
| mysql | utf8mb4 | utf8mb4_0900_ai_ci |
| messager | utf8mb4 | utf8mb4_unicode_ci |
| messenger_prod | utf8mb4 | utf8mb4_unicode_ci |
| ai_hub | utf8mb4 | utf8mb4_unicode_ci |
| al_db | utf8mb4 | utf8mb4_unicode_ci |
| trend_api | utf8mb4 | utf8mb4_unicode_ci |
| admin_neeklo | utf8mb4 | utf8mb4_unicode_ci |
| gaze_ai | utf8mb4 | utf8mb4_unicode_ci |
| parser_tg | utf8mb4 | utf8mb4_unicode_ci |
| proffi_center | utf8mb4 | utf8mb4_0900_ai_ci |
| msk_premium_ceiling | utf8mb4 | utf8mb4_unicode_ci |
| dsc23ytp_check | utf8mb4 | utf8mb4_unicode_ci |
| parser_bot_admin | utf8mb4 | utf8mb4_unicode_ci |

> **Default charset:** `utf8mb4` on all databases — correct for production  
> **Create new DB with:** `CREATE DATABASE ai_gateway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`

---

## 10. /var/www Structure

```
/var/www/
├── html/                         (8K)  — default nginx page
├── _letsencrypt/                 (16K) — Let's Encrypt webroot
├── tesseract-api/                (24K)
├── essens-store.ru/              (6.3M)
├── ai-hub-backend/               (44M)
├── parser-traidagent/            (127M)
├── p-d-a-b.neeklo.ru/           (150M)
├── admin.neeklo.ru/              (157M)
├── trend-api/                    (264M)
├── image-to-text-bot/            (298M)
├── AL/                           (327M)  — Laravel: api.siteaccess.ru
├── parser-tg-frontend/           (356M)
├── al.siteaccess.ru/             (392M)  — Node (port 3001)
├── msk.proffi-center.ru/         (426M)
├── proffi-center/                (437M)
├── messenger/                    (494M)
├── online.siteaccess.ru/         (661M)  — Node (port 3100)
├── ai-platform/                  (686M)  ← CURRENT crm.al.siteaccess.ru
│   ├── apps/
│   │   ├── api/        — Node backend (PM2 ai-gateway, port 4100)
│   │   ├── web/
│   │   │   └── dist/   — Frontend SPA (current nginx root)
│   │   └── workers/    — PM2 ai-workers
│   ├── packages/
│   ├── infra/
│   └── logs/
├── auto.siteaccess.ru/           (817M)  — PHP 8.3
├── messager/                     (994M)  — Node (port 30000)
└── parser-tg/                    (1.2G)
```

---

## Safe Deployment Plan

### Overview

**What we do:**
1. Create `/var/www/ai-gateway` as the new project directory
2. Build and deploy fluid-orb-talk frontend there
3. Register a new PM2 process for the backend on a free port (`:5000`)
4. Change only `root` in Nginx config for `crm.al.siteaccess.ru`
5. Add new `location /gateway-api/` for new backend (if needed)

**What we do NOT touch:**
- `/var/www/ai-platform/` — not modified, not deleted
- PM2 processes `ai-gateway` (ID 4), `ai-workers` (ID 3) — not stopped
- Port `:4100` — remains active
- Existing API locations `/api/`, `/v1/`, `/metrics`, `/health` — remain proxied to `:4100`
- SSL certificate — already valid, no changes needed

---

## Nginx Config Changes

### Current config location
```
/etc/nginx/sites-available/crm.al.siteaccess.ru
```

### Only line that changes

**Before (both :80 and :443 blocks):**
```nginx
location / {
    root /var/www/ai-platform/apps/web/dist;
    index index.html;
    try_files $uri $uri/ /index.html;
}
```

**After:**
```nginx
location / {
    root /var/www/ai-gateway/dist;
    index index.html;
    try_files $uri $uri/ /index.html;
}
```

### Full new config (crm.al.siteaccess.ru)

```nginx
server {
    listen 80;
    server_name crm.al.siteaccess.ru;

    # Existing backend — DO NOT REMOVE
    location /api/ {
        proxy_pass http://127.0.0.1:4100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /v1/ {
        proxy_pass http://127.0.0.1:4100;
    }

    location /metrics {
        proxy_pass http://127.0.0.1:4100;
    }

    location /health {
        proxy_pass http://127.0.0.1:4100;
    }

    # NEW: ai-gateway backend (fluid-orb-talk backend, Phase 2+)
    location /gateway/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # CHANGED: new frontend root
    location / {
        root /var/www/ai-gateway/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}

server {
    listen 443 ssl;
    server_name crm.al.siteaccess.ru;

    ssl_certificate /etc/letsencrypt/live/crm.al.siteaccess.ru/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/crm.al.siteaccess.ru/privkey.pem;

    # Existing backend — DO NOT REMOVE
    location /api/ {
        proxy_pass http://127.0.0.1:4100;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /v1/ {
        proxy_pass http://127.0.0.1:4100;
    }

    location /metrics {
        proxy_pass http://127.0.0.1:4100;
    }

    location /health {
        proxy_pass http://127.0.0.1:4100;
    }

    # NEW: ai-gateway backend (fluid-orb-talk backend, Phase 2+)
    location /gateway/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 3600s;
    }

    # CHANGED: new frontend root
    location / {
        root /var/www/ai-gateway/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Deployment Steps (in order)

### Step 1 — Build frontend locally

```bash
cd c:\OSPanel\domains\al-temp\nexus-core-studio
npm run build
# Result: dist/ folder with index.html + assets/
```

### Step 2 — Create directory on server

```bash
# On VPS (DO NOT run yet — execute when ready)
mkdir -p /var/www/ai-gateway/dist
chown -R www-data:www-data /var/www/ai-gateway
```

### Step 3 — Upload built frontend to server

```bash
# From local machine
scp -r dist/* root@89.169.39.244:/var/www/ai-gateway/dist/
# Or via rsync:
rsync -avz --progress dist/ root@89.169.39.244:/var/www/ai-gateway/dist/
```

### Step 4 — Update Nginx config

```bash
# On VPS
# Edit only the two 'root' lines in /etc/nginx/sites-available/crm.al.siteaccess.ru
# Change:   root /var/www/ai-platform/apps/web/dist;
# To:       root /var/www/ai-gateway/dist;

# Validate:
nginx -t

# Reload (zero downtime):
systemctl reload nginx
```

### Step 5 — Verify

```bash
curl -I https://crm.al.siteaccess.ru
# Should return 200 with new frontend
# API on :4100 still works: curl https://crm.al.siteaccess.ru/health
```

### Step 6 — Backend (Phase 2, when ready)

```bash
# Create database
mysql -e "CREATE DATABASE ai_gateway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Upload backend to /var/www/ai-gateway/backend/
# Install dependencies
cd /var/www/ai-gateway/backend && npm install --production

# Register in PM2 (picks free port :5000)
pm2 start src/index.js --name "ai-gateway-new" --env production
pm2 save
```

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Nginx config error breaks domain | Low | High | `nginx -t` before reload; reload not restart |
| New frontend fails to load | Low | Medium | Keep old dist as `/var/www/ai-platform/apps/web/dist` — revert in 10s |
| Port :5000 conflict | Low | Low | Check with `ss -tlnp | grep 5000` before starting |
| Disk space exhausted | Very Low | High | 40G free; new project ~100MB max |
| SSL certificate expiry | Very Low | High | Certificate exists for crm.al.siteaccess.ru; auto-renewed by Certbot |

**Rollback procedure (< 30 seconds):**
```bash
# Revert root line in nginx config
sed -i 's|root /var/www/ai-gateway/dist|root /var/www/ai-platform/apps/web/dist|g' \
  /etc/nginx/sites-available/crm.al.siteaccess.ru
systemctl reload nginx
```
