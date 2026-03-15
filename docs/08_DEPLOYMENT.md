# Deployment

## Standard Deployment Flow (current)

1. Update source locally.
2. Upload changed files to server build tree (`/tmp/fluid-orb-talk-build`).
3. Build frontend on server:
   - `cd /tmp/fluid-orb-talk-build`
   - `npm run build`
4. Publish frontend:
   - copy `dist/*` -> `/var/www/ai-gateway/dist/`
5. Build backend on server:
   - `cd /var/www/ai-gateway/backend`
   - `npm run build`
6. Restart backend:
   - `pm2 restart ai-gateway-new --update-env`
7. Verify endpoints (`/auth/login`, `/gateway/chat`, `/auth/me`).

## Commands Used Frequently

Frontend:

```bash
cd /tmp/fluid-orb-talk-build
npm run build
cp -r dist/* /var/www/ai-gateway/dist/
```

Backend:

```bash
cd /var/www/ai-gateway/backend
npm run build
pm2 restart ai-gateway-new --update-env
```

Nginx:

```bash
nginx -t
systemctl reload nginx
```

## Health Checks

- `https://crm.al.siteaccess.ru` (frontend)
- `https://crm.al.siteaccess.ru/auth/login` (auth path via proxy)
- `https://crm.al.siteaccess.ru/gateway/chat` (gateway path via proxy)

## Environment Variables (runtime backend)

Expected key groups:

- app: `PORT`, `NODE_ENV`, `CORS_ORIGIN`
- auth: `JWT_SECRET`
- postgres: `PG_HOST`, `PG_PORT`, `PG_DATABASE`, `PG_USER`, `PG_PASSWORD`
- redis: `REDIS_URL`
- providers: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY`, `ELEVENLABS_API_KEY`, `REPLICATE_API_KEY`

