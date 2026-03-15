import { ProviderRegistry } from '../providers/ProviderRegistry.js';
import { ReplicateProvider } from '../providers/ReplicateProvider.js';

export interface ImageGenerationConfig {
  prompt: string;
  negativePrompt?: string;
  model?: 'flux-pro' | 'sdxl' | 'dall-e-3' | 'midjourney';
  width?: number;
  height?: number;
  steps?: number;
  guidance?: number;
}

export interface ImageGenerationResult {
  url: string;
  model: string;
  provider: string;
  width: number;
  height: number;
}

/**
 * ImagePipeline — Handles all image generation tasks.
 *
 * Supported operations (Phase 4):
 *   - text → image (Flux, SDXL, DALL-E)
 *   - image → image (img2img, inpainting)
 *   - image upscaling
 */
export class ImagePipeline {
  private static instance: ImagePipeline;
  private registry: ProviderRegistry;

  private constructor() {
    this.registry = ProviderRegistry.getInstance();
  }

  static getInstance(): ImagePipeline {
    if (!ImagePipeline.instance) {
      ImagePipeline.instance = new ImagePipeline();
    }
    return ImagePipeline.instance;
  }

  async generate(config: ImageGenerationConfig): Promise<ImageGenerationResult> {
    // TODO Phase 4: route to correct provider based on config.model
    const provider = this.registry.getProvider('replicate') as unknown as ReplicateProvider;
    const url = await provider.generateImage(config.prompt, { model: config.model ?? 'flux-pro' });

    return {
      url,
      model: config.model ?? 'flux-pro',
      provider: 'replicate',
      width: config.width ?? 1024,
      height: config.height ?? 1024,
    };
  }

  async imageToImage(
    sourceImageBase64: string,
    config: ImageGenerationConfig,
  ): Promise<ImageGenerationResult> {
    // TODO Phase 4: implement img2img pipeline
    return {
      url: '[ImagePipeline stub] img2img result URL',
      model: config.model ?? 'sdxl',
      provider: 'replicate',
      width: config.width ?? 1024,
      height: config.height ?? 1024,
    };
  }

  async upscale(imageBase64: string, scale: number = 4): Promise<string> {
    // TODO Phase 4: implement upscaling via Real-ESRGAN or similar
    return '[ImagePipeline stub] Upscaled image URL';
  }
}
