# CURSOR_CONTEXT

## Quick Project Identity

- Project: `fluid-orb-talk` (AI Gateway Platform)
- Production server: `89.169.39.244`
- Public domain: `https://crm.al.siteaccess.ru`
- Backend port: `5000`

## Critical Paths

- Frontend auth pages: `/login`, `/register`, `/forgot-password`, `/reset-password`
- Protected app starts at `/dashboard`
- Sidebar user panel: `src/components/layout/SidebarUser.tsx`
- Auth state/context: `src/contexts/AuthContext.tsx`
- Auth guard: `src/components/auth/ProtectedRoute.tsx`

## Backend Core Files

- App wiring: `backend/src/app.ts`
- Startup: `backend/src/index.ts`
- Auth routes: `backend/src/routes/auth.ts`
- Gateway routes: `backend/src/routes/gateway.ts`
- Conversations: `backend/src/routes/conversations.ts`
- Gateway orchestrator: `backend/src/gateway/GatewayCore.ts`
- Routing strategy: `backend/src/gateway/SuperRouter.ts`
- Execution/fallback: `backend/src/gateway/ExecutionEngine.ts`
- Postgres client/schema ensure: `backend/src/db/PostgresClient.ts`
- Redis limiter: `backend/src/security/RedisRateLimiter.ts`

## Active Architecture Reality

- Production flow primarily uses:
  - `/auth/*`
  - `/conversations*`
  - `/gateway/*` (proxied to backend root routes)
- `/api/v1/*` modules are present; some are legacy/skeleton and not the primary production path.

## Auth Behavior

- Login returns `access_token`, `refresh_token`, `token` (compat) and user object.
- Access token: `15m`, refresh token: `30d`.
- Russian validation/error messaging implemented in auth route handlers.
- Login redirect in frontend goes to `/dashboard`.

## Database Reality

- PostgreSQL only for stabilized runtime paths.
- Core tables: `users`, `conversations`, `messages`, `password_reset_tokens`, `usage_logs`, `conversation_summaries`.
- Messages support `payload JSONB`, `model`, `token_count`, `latency_ms`.
- Context indexes include:
  - `idx_messages_context_window`
  - `idx_messages_conversation_created`

## Infrastructure

- Nginx config reference: `nginx-crm.conf`
  - `/auth/` -> `127.0.0.1:5000`
  - `/gateway/` -> `127.0.0.1:5000/`
  - `/` static SPA from `/var/www/ai-gateway/dist`
- PM2 process: `ai-gateway-new`

## Deployment Workflow (current)

1. Upload changes to `/tmp/fluid-orb-talk-build`
2. Build frontend there (`npm run build`)
3. Copy `dist/*` to `/var/www/ai-gateway/dist`
4. Build backend in `/var/www/ai-gateway/backend`
5. `pm2 restart ai-gateway-new --update-env`

## Git/Sync Notes

- Server git working tree used in operations: `/tmp/fluid-orb-talk-build`
- Runtime directory is separate: `/var/www/ai-gateway`
- Keep synchronization discipline:
  - server runtime state protected,
  - then sync server git,
  - then sync local (`git fetch`, `git reset --hard origin/main`).

## Important Caveats for New AI Chats

- Do not assume old root markdown docs are accurate; many describe earlier target architecture.
- Verify whether a requested change affects:
  - stabilized production path (`/auth`, `/gateway`, `/conversations`) or
  - legacy `/api/v1` skeleton modules.
- Avoid deleting untracked infra/test files unless explicitly requested.
- Server is treated as source-of-truth in this project workflow.

