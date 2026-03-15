-- Safe, idempotent architecture upgrade for PostgreSQL runtime schema.
-- This migration is compatible with existing deployments and does not drop data.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

ALTER TABLE IF EXISTS messages ADD COLUMN IF NOT EXISTS payload JSONB NULL;
ALTER TABLE IF EXISTS messages ADD COLUMN IF NOT EXISTS model TEXT NULL;
ALTER TABLE IF EXISTS messages ADD COLUMN IF NOT EXISTS token_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE IF EXISTS messages ADD COLUMN IF NOT EXISTS latency_ms INTEGER NOT NULL DEFAULT 0;

ALTER TABLE IF EXISTS conversations ADD COLUMN IF NOT EXISTS model TEXT NULL;
ALTER TABLE IF EXISTS conversations ADD COLUMN IF NOT EXISTS system_prompt TEXT NULL;
ALTER TABLE IF EXISTS conversations ADD COLUMN IF NOT EXISTS context_summary TEXT NULL;

CREATE TABLE IF NOT EXISTS conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  message_start INTEGER NULL,
  message_end INTEGER NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_messages_context_window
  ON messages (conversation_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_conversation_summaries_conversation_id
  ON conversation_summaries (conversation_id);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'usage_logs'
      AND column_name = 'user_id'
      AND data_type <> 'uuid'
  ) THEN
    ALTER TABLE usage_logs
      ALTER COLUMN user_id TYPE UUID
      USING (
        CASE
          WHEN user_id ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
          THEN user_id::uuid
          ELSE NULL
        END
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'usage_logs'
      AND constraint_name = 'usage_logs_user_id_fkey'
  ) THEN
    ALTER TABLE usage_logs
      ADD CONSTRAINT usage_logs_user_id_fkey
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;
  END IF;
END
$$;

