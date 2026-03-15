import { BaseNode } from './BaseNode.js';
import type { NodeExecutionContext, NodeOutput } from '../../types/workflow.types.js';

/** TriggerNode — Entry point for a workflow. Emits the initial payload. */
export class TriggerNode extends BaseNode {
  readonly type = 'trigger';

  async execute(context: NodeExecutionContext): Promise<NodeOutput> {
    return { success: true, data: context.input, nodeType: this.type };
  }
}
