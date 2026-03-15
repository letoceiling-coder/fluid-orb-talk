# API Reference (Current Implementation)

## Auth

Base paths:

- `/auth`
- `/api/v1/auth`

Endpoints:

- `POST /register`
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password`
- `POST /refresh`
- `GET /me`

## Conversations

- `POST /conversations`
- `GET /conversations`
- `GET /conversations/:id/messages?cursor=&limit=`
- `POST /conversations/:id/messages`
- `DELETE /conversations/:id`

## Gateway (public path via Nginx prefix)

Public URLs:

- `POST /gateway/chat`
- `POST /gateway/vision`
- `POST /gateway/image`
- `POST /gateway/tts`
- `GET /gateway/stream` (WebSocket)

Backend internal mapping:

- `/chat`, `/vision`, `/image`, `/tts`, `/stream`

## Legacy/Module API (`/api/v1/*`)

- `/api/v1/chat` (+ `/stream` ws)
- `/api/v1/vision/analyze` (+ `/stream` ws)
- `/api/v1/media/image|video|tts|stt`
- `/api/v1/models`
- `/api/v1/agents`
- `/api/v1/workflows`
- `/api/v1/keys`
- `/api/v1/usage` and `/summary`

Some of these modules are partially skeleton and not the main production route path.

## Common Response Fields

Gateway chat/vision commonly include:

- `provider`
- `model`
- `usage`:
  - `prompt_tokens`
  - `completion_tokens`
  - `total_tokens`

## Auth Headers

- JWT: `Authorization: Bearer <token>`
- API key (gateway alternative): `x-api-key: <key>`

## Error Patterns

- Validation errors: `400`
- Unauthorized: `401`
- Not found: `404`
- Rate limit: `429`
- Provider/gateway failures: `502` or `500`

