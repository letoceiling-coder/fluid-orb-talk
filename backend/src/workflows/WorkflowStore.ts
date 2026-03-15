import { PostgresClient } from '../db/PostgresClient.js';
import type { WorkflowGraph } from '../types/workflow.types.js';

/**
 * WorkflowStore — Persists and loads workflow graphs from the database.
 */
export class WorkflowStore {
  private static instance: WorkflowStore;
  private db: PostgresClient;

  private constructor() {
    this.db = PostgresClient.getInstance();
  }

  static getInstance(): WorkflowStore {
    if (!WorkflowStore.instance) {
      WorkflowStore.instance = new WorkflowStore();
    }
    return WorkflowStore.instance;
  }

  async save(workspaceId: string, name: string, graph: WorkflowGraph): Promise<string> {
    const result = await this.db.query<{ id: string }>(
      `INSERT INTO workflows (id, workspace_id, name, graph_json, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())
       RETURNING id`,
      [workspaceId, name, JSON.stringify(graph)],
    );
    return result.rows[0].id;
  }

  async load(workflowId: string): Promise<WorkflowGraph | null> {
    const rows = await this.db.query<{ graph_json: string }>(
      `SELECT graph_json FROM workflows WHERE id = $1 LIMIT 1`,
      [workflowId],
    );
    const row = rows.rows[0];
    return row ? (JSON.parse(row.graph_json) as WorkflowGraph) : null;
  }

  async list(workspaceId: string): Promise<Array<{ id: string; name: string; createdAt: Date }>> {
    const rows = await this.db.query<{ id: string; name: string; created_at: string }>(
      `SELECT id, name, created_at FROM workflows WHERE workspace_id = $1 ORDER BY created_at DESC`,
      [workspaceId],
    );
    return rows.rows.map((r: { id: string; name: string; created_at: string }) => ({
      id: r.id,
      name: r.name,
      createdAt: new Date(r.created_at),
    }));
  }

  async delete(workflowId: string): Promise<void> {
    await this.db.query(`DELETE FROM workflows WHERE id = $1`, [workflowId]);
  }
}
