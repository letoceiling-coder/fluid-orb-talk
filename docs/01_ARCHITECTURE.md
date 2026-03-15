# Architecture

## High-Level Layers

1. **Frontend UI Layer** (`src/pages`, `src/components`)
2. **Frontend Control Layer** (`src/contexts`, `src/controllers`, `src/services`)
3. **API Layer** (Fastify route plugins in `backend/src/routes`)
4. **Gateway Orchestration Layer** (`GatewayCore`, `SuperRouter`, `ExecutionEngine`)
5. **Provider Layer** (`backend/src/providers`)
6. **Persistence/Security Layer** (`PostgresClient`, Redis limiter, JWT/auth)

## Runtime Request Flow

### Chat (`/gateway/chat`)

- Nginx forwards `/gateway/chat` to backend `/chat`.
- `gatewayRoutes` validates payload (Zod + max length).
- Auth accepted via JWT or `x-api-key`.
- Conversation history (last 20 messages) loaded from PostgreSQL when `conversation_id` is present.
- `GatewayCore.handle()` delegates:
  - `SuperRouter` (provider selection strategy),
  - `ExecutionEngine` (fallback chain execution).
- Usage logging persisted to `usage_logs`.
- Assistant response + metadata persisted in `messages` table.

### Vision (`/gateway/vision`)

- Gateway route sends image prompt to `GatewayCore` as `vision/analyze`.
- Execution goes through provider fallback chain.
- Returns normalized response with `provider`, `model`, `usage`.

### Streaming (`/gateway/stream`)

- WebSocket endpoint in `gatewayRoutes`.
- Uses `WSHub` and `StreamHandler` to forward streamed chunks/events.

## Backend Boot Sequence

From `backend/src/index.ts`:

1. Build Fastify app (`buildApp()`).
2. Connect PostgreSQL and ensure schema (`PostgresClient.connect()`).
3. Connect Redis (`RedisRateLimiter.connect()`).
4. Initialize websocket hub (`WSHub`).
5. Listen on `PORT` (default `5000`).

## Route Registration Model

From `backend/src/app.ts`:

- `gatewayRoutes` mounted at root (`prefix: ''`)
- auth mounted at:
  - `/auth`
  - `/api/v1/auth`
- conversations mounted at root (`/conversations*`)
- additional module routes under `/api/v1/*` (`chat`, `vision`, `media`, etc.)

## Architectural Reality (important)

- The repository includes both:
  - stabilized auth/conversation/gateway implementation,
  - earlier skeleton modules under `/api/v1/*`.
- Gateway and auth flows are the primary production path used by Nginx.
- Some legacy/skeleton route modules still exist and are documented in `02_BACKEND.md`.

