import { BaseNode } from './BaseNode.js';
import type { NodeExecutionContext, NodeOutput } from '../../types/workflow.types.js';

/** PromptNode — Formats a prompt template using context variables. */
export class PromptNode extends BaseNode {
  readonly type = 'prompt';

  async execute(context: NodeExecutionContext): Promise<NodeOutput> {
    const template = String(context.config.template ?? '{{input}}');
    const rendered = template.replace(/\{\{(\w+)\}\}/g, (_, key) =>
      String((context.input as Record<string, unknown>)[key] ?? ''),
    );
    return { success: true, data: { prompt: rendered }, nodeType: this.type };
  }
}
