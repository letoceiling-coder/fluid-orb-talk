import { BaseAgent } from './BaseAgent.js';
import type { AgentConfig, AgentCapability } from '../../types/agent.types.js';

/**
 * ImageCreatorAgent — Generates product shots, artwork, and marketing visuals.
 *
 * Capabilities: Vision, Image, Code
 */
export class ImageCreatorAgent extends BaseAgent {
  readonly name = 'Image Creator Agent';
  readonly capabilities: AgentCapability[] = ['Vision', 'Image', 'Code'];

  constructor(config: AgentConfig) {
    super(config);
  }

  async plan(task: string): Promise<string[]> {
    return [
      `Parse visual requirements: ${task}`,
      'Generate detailed prompt from task description',
      'Select optimal image generation model',
      'Generate primary image',
      'Apply post-processing and style adjustments',
      'Return final image URL',
    ];
  }

  async step(stepDescription: string): Promise<string> {
    return `[ImageCreatorAgent stub] Completed step: ${stepDescription}`;
  }

  async observe(toolResult: string): Promise<'continue' | 'done' | 'error'> {
    return 'continue';
  }
}
