import { ProviderRegistry } from '../providers/ProviderRegistry.js';
import { ReplicateProvider } from '../providers/ReplicateProvider.js';

export interface VideoGenerationConfig {
  prompt: string;
  model?: 'gen-3-alpha' | 'pika-2' | 'sora' | 'kling-2' | 'ray-2';
  durationSeconds?: number;
  fps?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  sourceImageBase64?: string;
}

export interface VideoGenerationResult {
  url: string;
  model: string;
  provider: string;
  durationSeconds: number;
}

/**
 * VideoPipeline — Handles all video generation tasks.
 *
 * Supported operations (Phase 4):
 *   - text → video (Runway Gen-3, Pika, Kling)
 *   - image → video (animate a still image)
 *   - video editing (lipsync, style transfer)
 */
export class VideoPipeline {
  private static instance: VideoPipeline;
  private registry: ProviderRegistry;

  private constructor() {
    this.registry = ProviderRegistry.getInstance();
  }

  static getInstance(): VideoPipeline {
    if (!VideoPipeline.instance) {
      VideoPipeline.instance = new VideoPipeline();
    }
    return VideoPipeline.instance;
  }

  async generate(config: VideoGenerationConfig): Promise<VideoGenerationResult> {
    // TODO Phase 4: route to Runway / Pika based on config.model
    const provider = this.registry.getProvider('replicate') as ReplicateProvider;
    const url = await provider.generateVideo(config.prompt, { model: config.model ?? 'pika-2' });

    return {
      url,
      model: config.model ?? 'pika-2',
      provider: 'replicate',
      durationSeconds: config.durationSeconds ?? 4,
    };
  }

  async imageToVideo(
    sourceImageBase64: string,
    config: VideoGenerationConfig,
  ): Promise<VideoGenerationResult> {
    // TODO Phase 4: animate still image into video clip
    return {
      url: '[VideoPipeline stub] image-to-video URL',
      model: config.model ?? 'gen-3-alpha',
      provider: 'replicate',
      durationSeconds: config.durationSeconds ?? 4,
    };
  }

  async lipsync(videoUrl: string, audioBuffer: Buffer): Promise<string> {
    // TODO Phase 4: apply lipsync via Sync.so or similar
    return '[VideoPipeline stub] Lipsync video URL';
  }
}
