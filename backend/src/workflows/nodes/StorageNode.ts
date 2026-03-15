import { BaseNode } from './BaseNode.js';
import { PostgresClient } from '../../db/PostgresClient.js';
import type { NodeExecutionContext, NodeOutput } from '../../types/workflow.types.js';

/** StorageNode — Saves node output to the database or file storage. */
export class StorageNode extends BaseNode {
  readonly type = 'storage';

  async execute(context: NodeExecutionContext): Promise<NodeOutput> {
    // TODO Phase 5: implement file storage (local or S3)
    // For now, log to DB as JSON
    const db = PostgresClient.getInstance();
    if (!context.workflowId) {
      return {
        success: true,
        data: { stored: false, reason: 'missing workflowId' },
        nodeType: this.type,
      };
    }

    await db.query(
      `INSERT INTO workflow_runs (id, workflow_id, status, output_json, started_at)
       VALUES (gen_random_uuid(), $1, 'complete', $2, NOW())`,
      [context.workflowId, JSON.stringify(context.input)],
    );

    return {
      success: true,
      data: { stored: true, key: `workflow/${context.workflowId}` },
      nodeType: this.type,
    };
  }
}
