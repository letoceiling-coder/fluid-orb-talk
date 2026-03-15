import { BaseNode } from './BaseNode.js';
import { AudioPipeline } from '../../media/AudioPipeline.js';
import type { NodeExecutionContext, NodeOutput } from '../../types/workflow.types.js';

/** VoiceGeneratorNode — Calls AudioPipeline to synthesize speech from text. */
export class VoiceGeneratorNode extends BaseNode {
  readonly type = 'voice-generator';

  async execute(context: NodeExecutionContext): Promise<NodeOutput> {
    const pipeline = AudioPipeline.getInstance();
    const text = String(context.input.text ?? '');
    const audioBuffer = await pipeline.tts(text, {
      voice: context.config.voice as string | undefined,
      language: context.config.language as string | undefined,
    });
    return {
      success: true,
      data: { audioBase64: audioBuffer.toString('base64'), mimeType: 'audio/mp3' },
      nodeType: this.type,
    };
  }
}
