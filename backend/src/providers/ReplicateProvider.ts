import Replicate from 'replicate';
import { BaseProvider } from './BaseProvider.js';
import type { TaskType } from '../types/gateway.types.js';
import type {
  Message,
  ChatConfig,
  VisionConfig,
  TTSConfig,
  STTConfig,
} from '../types/provider.types.js';

const IMAGE_MODEL = 'black-forest-labs/flux-schnell';
const VIDEO_MODEL = 'minimax/video-01';

export class ReplicateProvider extends BaseProvider {
  readonly name = 'replicate';
  readonly supportedTaskTypes: TaskType[] = ['image/generate', 'video/generate'];

  qualityRank  = 75;
  currentLoad  = 0;
  region       = 'us-west-2';

  private client: Replicate;
  private latencyMs = 5200;

  constructor() {
    super();
    this.client = new Replicate({
      auth: process.env.REPLICATE_API_KEY ?? '',
    });
  }

  async generateImage(
    prompt: string,
    options: {
      model?: string;
      width?: number;
      height?: number;
      numOutputs?: number;
      steps?: number;
    } = {},
  ): Promise<string> {
    const model = options.model ?? IMAGE_MODEL;

    const output = await this.client.run(model as `${string}/${string}`, {
      input: {
        prompt,
        num_outputs:    options.numOutputs ?? 1,
        width:          options.width  ?? 1024,
        height:         options.height ?? 1024,
        num_inference_steps: options.steps ?? 4,
        aspect_ratio: '1:1',
        output_format: 'webp',
        output_quality: 80,
      },
    });

    const urls = this.extractUrls(output);
    if (!urls.length) throw new Error('Replicate: no image URLs returned');
    return urls[0];
  }

  async generateVideo(
    prompt: string,
    options: { model?: string } = {},
  ): Promise<string> {
    const model = options.model ?? VIDEO_MODEL;

    const output = await this.client.run(model as `${string}/${string}`, {
      input: { prompt, num_frames: 25, fps: 8 },
    });

    const urls = this.extractUrls(output);
    if (!urls.length) throw new Error('Replicate: no video URLs returned');
    return urls[0];
  }

  /** Extract URL strings from Replicate output (handles FileOutput, URL strings, arrays) */
  private extractUrls(output: unknown): string[] {
    if (!output) return [];
    const items = Array.isArray(output) ? output : [output];
    return items
      .map((item) => {
        if (typeof item === 'string') return item;
        // FileOutput objects have a .url() method or .url property
        if (item && typeof item === 'object') {
          const obj = item as Record<string, unknown>;
          if (typeof obj.url === 'function') return (obj.url as () => string)();
          if (typeof obj.url === 'string') return obj.url;
          if (typeof obj.toString === 'function') {
            const str = obj.toString();
            if (str.startsWith('http')) return str;
          }
        }
        return null;
      })
      .filter((u): u is string => typeof u === 'string' && u.startsWith('http'));
  }

  async chat(_messages: Message[], _config: ChatConfig): Promise<import('./BaseProvider.js').ChatResult> {
    throw new Error('ReplicateProvider: chat not supported.');
  }

  async chatStream(
    _messages: Message[],
    _config: ChatConfig,
    _onChunk: (chunk: string) => void,
    _onDone:  (usage: import('../types/gateway.types.js').TokenUsage) => void,
  ): Promise<void> {
    throw new Error('ReplicateProvider: chatStream not supported.');
  }

  async vision(_imageBase64: string, _prompt: string, _config: VisionConfig): Promise<import('./BaseProvider.js').VisionResult> {
    throw new Error('ReplicateProvider: direct vision not supported. Use OpenAI.');
  }

  async embed(_texts: string[], _model: string): Promise<number[][]> {
    throw new Error('ReplicateProvider: embed not supported.');
  }

  async tts(_text: string, _config: TTSConfig): Promise<Buffer> {
    throw new Error('ReplicateProvider: TTS not supported. Use ElevenLabs.');
  }

  async stt(_audioBuffer: Buffer, _config: STTConfig): Promise<string> {
    throw new Error('ReplicateProvider: STT not supported.');
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env.REPLICATE_API_KEY);
  }

  getLatencyEstimate(): number { return this.latencyMs; }

  getCostEstimate(units: number, taskType: TaskType): number {
    const rates: Partial<Record<TaskType, number>> = {
      'image/generate': 0.04,
      'video/generate': 0.50,
    };
    return (rates[taskType] ?? 0.04) * units;
  }
}
