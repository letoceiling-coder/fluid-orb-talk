import { BaseNode } from './BaseNode.js';
import axios from 'axios';
import type { NodeExecutionContext, NodeOutput } from '../../types/workflow.types.js';

/** APICallNode — Makes an external HTTP request and returns the response body. */
export class APICallNode extends BaseNode {
  readonly type = 'api-call';

  async execute(context: NodeExecutionContext): Promise<NodeOutput> {
    const url = String(context.config.url ?? '');
    const method = String(context.config.method ?? 'GET');
    const headers = (context.config.headers as Record<string, string>) ?? {};
    const body = context.config.body;

    if (!url) {
      return { success: false, data: { error: 'APICallNode: url is required' }, nodeType: this.type };
    }

    try {
      const response = await axios.request({
        url,
        method: method.toUpperCase(),
        headers,
        data: body,
        timeout: 30_000,
      });
      return { success: true, data: { status: response.status, body: response.data as Record<string, unknown> }, nodeType: this.type };
    } catch (err) {
      return {
        success: false,
        data: { error: err instanceof Error ? err.message : 'HTTP request failed' },
        nodeType: this.type,
      };
    }
  }
}
