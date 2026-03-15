import { createHash, randomBytes } from 'crypto';
import { PostgresClient } from '../db/PostgresClient.js';

interface WorkspaceInfo {
  workspaceId: string;
  userId: string;
  rateLimit: number;
}

/**
 * ApiKeyManager — Generates, validates, and revokes API keys.
 *
 * Keys are stored as SHA-256 hashes. The raw key is shown once on creation.
 * Format: `gw_<32 random bytes hex>`
 */
export class ApiKeyManager {
  private static instance: ApiKeyManager;
  private db: PostgresClient;

  private constructor() {
    this.db = PostgresClient.getInstance();
  }

  static getInstance(): ApiKeyManager {
    if (!ApiKeyManager.instance) {
      ApiKeyManager.instance = new ApiKeyManager();
    }
    return ApiKeyManager.instance;
  }

  async generateKey(workspaceId: string, name: string, rateLimit = 60): Promise<string> {
    const rawKey = `gw_${randomBytes(32).toString('hex')}`;
    const keyHash = this.hash(rawKey);

    await this.db.query(
      `INSERT INTO api_keys (id, workspace_id, key_hash, name, rate_limit, is_active, created_at)
       VALUES (gen_random_uuid(), $1, $2, $3, $4, TRUE, NOW())`,
      [workspaceId, keyHash, name, rateLimit],
    );

    // Return raw key once — never stored in plaintext
    return rawKey;
  }

  async validateKey(rawKey: string): Promise<WorkspaceInfo | null> {
    const keyHash = this.hash(rawKey);

    const rows = await this.db.query<any>(
      `SELECT ak.workspace_id, ak.rate_limit, w.user_id
       FROM api_keys ak
       JOIN workspaces w ON w.id = ak.workspace_id
       WHERE ak.key_hash = $1 AND ak.is_active = TRUE
       LIMIT 1`,
      [keyHash],
    );

    const row = rows.rows[0];
    if (!row) return null;

    return {
      workspaceId: row.workspace_id,
      userId: row.user_id,
      rateLimit: row.rate_limit,
    };
  }

  async revokeKey(keyId: string): Promise<void> {
    await this.db.query(
      `UPDATE api_keys SET is_active = FALSE WHERE id = $1`,
      [keyId],
    );
  }

  async listKeys(workspaceId: string): Promise<Array<{ id: string; name: string; createdAt: Date }>> {
    const rows = await this.db.query<{ id: string; name: string; created_at: string }>(
      `SELECT id, name, created_at FROM api_keys WHERE workspace_id = $1 AND is_active = TRUE ORDER BY created_at DESC`,
      [workspaceId],
    );
    return rows.rows.map((r) => ({ id: r.id, name: r.name, createdAt: new Date(r.created_at) }));
  }

  private hash(rawKey: string): string {
    return createHash('sha256').update(rawKey).digest('hex');
  }
}
