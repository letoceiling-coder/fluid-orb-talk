import { Pool, type PoolClient, type QueryResult } from 'pg';

export class PostgresClient {
  private static instance: PostgresClient;
  private pool: Pool | null = null;
  private connected = false;

  private constructor() {}

  static getInstance(): PostgresClient {
    if (!PostgresClient.instance) {
      PostgresClient.instance = new PostgresClient();
    }
    return PostgresClient.instance;
  }

  async connect(): Promise<void> {
    if (this.connected) return;

    this.pool = new Pool({
      host: process.env.PG_HOST ?? '127.0.0.1',
      port: Number(process.env.PG_PORT ?? 5432),
      database: process.env.PG_DATABASE ?? process.env.PG_DB ?? 'ai_gateway',
      user: process.env.PG_USER ?? 'postgres',
      password: String(process.env.PG_PASSWORD ?? ''),
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : undefined,
    });

    const client = await this.pool.connect();
    try {
      await client.query('SELECT 1');
      await this.ensureSchema(client);
      this.connected = true;
      console.log('[PG] Connected and schema ensured');
    } finally {
      client.release();
    }
  }

  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    if (!this.pool) {
      await this.connect();
    }
    if (!this.pool) {
      throw new Error('PostgresClient pool is not initialized');
    }
    return this.pool.query<T>(sql, params);
  }

  async transaction<T>(callback: (client: PoolClient) => Promise<T>): Promise<T> {
    if (!this.pool) {
      await this.connect();
    }
    if (!this.pool) {
      throw new Error('PostgresClient pool is not initialized');
    }
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  private async ensureSchema(client: PoolClient): Promise<void> {
    await client.query(`
      CREATE EXTENSION IF NOT EXISTS "pgcrypto";

      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'user',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL DEFAULT 'New conversation',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workspaces (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        plan TEXT NOT NULL DEFAULT 'free',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS api_keys (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        key_hash TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        rate_limit INTEGER NOT NULL DEFAULT 60,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_used_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        role TEXT NOT NULL,
        content TEXT NOT NULL,
        payload JSONB NULL,
        model TEXT NULL,
        token_count INTEGER NOT NULL DEFAULT 0,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        metadata JSONB NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS password_reset_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        token_hash TEXT NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS usage_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id TEXT NULL,
        user_id UUID NULL,
        provider TEXT NOT NULL,
        model TEXT NULL,
        task_type TEXT NOT NULL,
        status TEXT NOT NULL,
        latency_ms INTEGER NOT NULL DEFAULT 0,
        prompt_tokens INTEGER NOT NULL DEFAULT 0,
        completion_tokens INTEGER NOT NULL DEFAULT 0,
        total_tokens INTEGER NOT NULL DEFAULT 0,
        error_message TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workflows (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        graph_json TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS workflow_runs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'running',
        input_json JSONB NULL,
        output_json TEXT NULL,
        error_message TEXT NULL,
        started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        finished_at TIMESTAMPTZ NULL
      );

      CREATE TABLE IF NOT EXISTS conversation_summaries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        summary TEXT NOT NULL,
        message_start INTEGER NULL,
        message_end INTEGER NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );

      ALTER TABLE messages ADD COLUMN IF NOT EXISTS payload JSONB NULL;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS model TEXT NULL;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS token_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE messages ADD COLUMN IF NOT EXISTS latency_ms INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS model TEXT NULL;
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS system_prompt TEXT NULL;
      ALTER TABLE conversations ADD COLUMN IF NOT EXISTS context_summary TEXT NULL;

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

      CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);
      CREATE INDEX IF NOT EXISTS idx_workspaces_user_id ON workspaces(user_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_workspace_id ON api_keys(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
      CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON messages(conversation_id, created_at);
      CREATE INDEX IF NOT EXISTS idx_messages_context_window ON messages(conversation_id, created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_reset_tokens_user_id ON password_reset_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_reset_tokens_expires_at ON password_reset_tokens(expires_at);
      CREATE INDEX IF NOT EXISTS idx_workflows_workspace_id ON workflows(workspace_id);
      CREATE INDEX IF NOT EXISTS idx_workflow_runs_workflow_id ON workflow_runs(workflow_id);
      CREATE INDEX IF NOT EXISTS idx_conversation_summaries_conversation_id ON conversation_summaries(conversation_id);
    `);
  }
}

