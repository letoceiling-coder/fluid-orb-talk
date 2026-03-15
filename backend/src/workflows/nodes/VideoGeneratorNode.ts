import { BaseNode } from './BaseNode.js';
import { VideoPipeline } from '../../media/VideoPipeline.js';
import type { NodeExecutionContext, NodeOutput } from '../../types/workflow.types.js';

/** VideoGeneratorNode — Calls VideoPipeline to generate a video from a prompt. */
export class VideoGeneratorNode extends BaseNode {
  readonly type = 'video-generator';

  async execute(context: NodeExecutionContext): Promise<NodeOutput> {
    const pipeline = VideoPipeline.getInstance();
    const result = await pipeline.generate({
      prompt: String(context.input.prompt ?? ''),
    });
    return { success: true, data: result as unknown as Record<string, unknown>, nodeType: this.type };
  }
}
