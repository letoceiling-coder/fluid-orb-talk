import type { NodeExecutionContext, NodeOutput } from '../../types/workflow.types.js';
import { GatewayCore } from '../../gateway/GatewayCore.js';
import type { Message } from '../../types/provider.types.js';
import type { TaskType } from '../../types/gateway.types.js';
import { BaseNode } from './BaseNode.js';

/** AIModelNode — Sends a prompt to the AI Gateway and returns the response. */
export class AIModelNode extends BaseNode {
  readonly type = 'ai-model';

  async execute(context: NodeExecutionContext): Promise<NodeOutput> {
    const gateway = GatewayCore.getInstance();
    const taskType: TaskType = (context.config.taskType as TaskType) ?? 'text/chat';
    const messages: Message[] = [{ role: 'user', content: String(context.input.prompt ?? '') }];
    const config: Record<string, unknown> = (context.config.config as Record<string, unknown>) ?? {};

    const result = await gateway.handle({
      taskType,
      payload: { messages, config },
      workspaceId: context.workspaceId,
      userId: context.userId,
    });
    return { success: result.success, data: result.data ?? {}, nodeType: this.type };
  }
}
