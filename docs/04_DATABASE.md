# Database (PostgreSQL)

## Runtime DB

- Engine: PostgreSQL
- Connection managed by: `backend/src/db/PostgresClient.ts`
- DB name in production: `ai_gateway`

## Core Tables

- `users`
- `conversations`
- `messages`
- `password_reset_tokens`
- `usage_logs`
- `conversation_summaries`
- additional infra tables: `workspaces`, `api_keys`, `workflows`, `workflow_runs`

## Auth + Memory Schema

- `users`:
  - `id`, `email` (unique), `password_hash`, `name`, `role`, timestamps
- `conversations`:
  - `id`, `user_id` FK, `title`, timestamps
  - extended metadata: `model`, `system_prompt`, `context_summary`
- `messages`:
  - `id`, `conversation_id` FK, `role`, `content`
  - multimodal-ready fields: `payload JSONB`, `metadata JSONB`
  - analytics fields: `model`, `token_count`, `latency_ms`
- `password_reset_tokens`:
  - hashed token, expiration, `used_at`
- `usage_logs`:
  - provider/model/task, token counters, latency, status, `user_id UUID`

## Indexes

Important indexes confirmed in schema/runtime:

- `idx_messages_context_window (conversation_id, created_at DESC)`
- `idx_messages_conversation_created (conversation_id, created_at)`
- `idx_conversations_user_id`
- `idx_reset_tokens_expires_at`
- `idx_conversation_summaries_conversation_id`

## Context Window Behavior

Gateway chat context loading uses last 20 messages:

- query ordered `created_at DESC LIMIT 20`
- reversed before sending to model

This caps prompt growth and controls token usage.

## Migrations

- `backend/src/db/migrations/20260315_architecture_upgrade.sql`
- Schema is also auto-ensured at startup by `PostgresClient.ensureSchema()`.

## Notes

- MySQL runtime dependency has been removed from stabilized backend.
- `usage_logs.user_id` is normalized to UUID with FK to `users`.

