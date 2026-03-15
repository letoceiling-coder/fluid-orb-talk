# Backend

## Location

- Source: `backend/src`
- Entry point: `backend/src/index.ts`
- App assembly: `backend/src/app.ts`

## Modules

- `auth/` - JWT middleware, password hashing, API key helpers
- `db/` - PostgreSQL client, migrations, schema SQL
- `gateway/` - orchestration (`GatewayCore`, `SuperRouter`, `ExecutionEngine`)
- `providers/` - OpenAI, Anthropic, Google, ElevenLabs, Replicate adapters
- `routes/` - Fastify route plugins
- `security/` - Redis rate limiter
- `utils/` - usage logger
- `websocket/` - hub and stream handler
- `workflows/`, `agents/`, `media/` - mostly skeleton/partial features

## Active Production-Critical Routes

- `/auth/*`:
  - `POST /register`
  - `POST /login`
  - `POST /forgot-password`
  - `POST /reset-password`
  - `POST /refresh`
  - `GET /me`
- `/conversations*` CRUD + paginated messages
- `/chat`, `/vision`, `/image`, `/tts`, `/stream` (via `/gateway/*` at Nginx level)

## Security Controls

- `JWT_SECRET` is mandatory at startup.
- `/gateway/*` routes protected with JWT or API key.
- Redis-backed limits:
  - chat: 60/min
  - vision: 30/min
  - tts: 30/min
  - image: 20/min
  - stream: 60/min
- Input validation through Zod in auth/conversation/gateway critical routes.

## Provider Routing

Fallback chain in `ExecutionEngine`/`SuperRouter`:

- `text/chat`, `text/reasoning`, `vision/analyze`:
  - `openai -> anthropic -> google`
- `audio/tts`:
  - `elevenlabs -> openai`
- `audio/stt`:
  - `openai`
- `image/generate`, `video/generate`:
  - `replicate`

## Known Backend Split

There are two backend route families:

1. **Gateway/auth/conversations** (stabilized and used in production path)
2. **Legacy `/api/v1/*` skeleton routes** (some use old workspace assumptions and placeholders)

This is intentional current state and should be considered in future cleanup/refactor phases.

