import type { NodeExecutionContext, NodeOutput } from '../../types/workflow.types.js';

/**
 * BaseNode — Abstract base for all workflow node executors.
 *
 * Each node receives execution context (input data, config)
 * and returns an output that is passed to downstream nodes.
 */
export abstract class BaseNode {
  abstract readonly type: string;

  abstract execute(context: NodeExecutionContext): Promise<NodeOutput>;
}
