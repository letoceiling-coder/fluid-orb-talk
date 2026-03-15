import { BaseNode } from './BaseNode.js';
import { ImagePipeline } from '../../media/ImagePipeline.js';
import type { NodeExecutionContext, NodeOutput } from '../../types/workflow.types.js';
import type { ImageGenerationConfig } from '../../media/ImagePipeline.js';

/** ImageGeneratorNode — Calls ImagePipeline to generate an image from a prompt. */
export class ImageGeneratorNode extends BaseNode {
  readonly type = 'image-generator';

  async execute(context: NodeExecutionContext): Promise<NodeOutput> {
    const pipeline = ImagePipeline.getInstance();
    const config: ImageGenerationConfig = {
      prompt: String(context.input.prompt ?? ''),
    };
    const result = await pipeline.generate(config);
    return { success: true, data: result as unknown as Record<string, unknown>, nodeType: this.type };
  }
}
