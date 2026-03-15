import { PostgresClient } from '../db/PostgresClient.js';

export interface UsageLogEntry {
  provider:         string;
  model?:           string;
  taskType:         string;
  status:           'success' | 'error';
  latencyMs:        number;
  promptTokens?:    number;
  completionTokens?: number;
  totalTokens?:     number;
  workspaceId?:     string;
  userId?:          string;
  errorMessage?:    string;
}

/**
 * UsageLogger — Persists per-request usage metrics including token counts.
 *
 * All writes are fire-and-forget: logging must never interrupt request flow.
 */
export class UsageLogger {
  private static instance: UsageLogger;
  private db:      PostgresClient;
  private enabled: boolean;

  private constructor() {
    this.db      = PostgresClient.getInstance();
    this.enabled = process.env.ENABLE_USAGE_LOGGING !== 'false';
  }

  static getInstance(): UsageLogger {
    if (!UsageLogger.instance) {
      UsageLogger.instance = new UsageLogger();
    }
    return UsageLogger.instance;
  }

  async log(entry: UsageLogEntry): Promise<void> {
    if (!this.enabled) return;

    try {
      await this.db.query(
        `INSERT INTO usage_logs
           (workspace_id, user_id, provider, model, task_type, status,
            latency_ms, prompt_tokens, completion_tokens, total_tokens,
            error_message, created_at)
         VALUES
           ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
        [
          entry.workspaceId        ?? null,
          entry.userId             ?? null,
          entry.provider,
          entry.model              ?? null,
          entry.taskType,
          entry.status,
          entry.latencyMs,
          entry.promptTokens       ?? 0,
          entry.completionTokens   ?? 0,
          entry.totalTokens        ?? 0,
          entry.errorMessage       ?? null,
        ],
      );
    } catch (err) {
      // Never throw from logger
      console.error('[UsageLogger] Failed to persist log entry:', err);
    }
  }
}
