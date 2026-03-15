import Anthropic from '@anthropic-ai/sdk';
import { BaseProvider } from './BaseProvider.js';
import type { ChatResult, VisionResult } from './BaseProvider.js';
import type { TaskType, TokenUsage } from '../types/gateway.types.js';
import type {
  Message,
  ChatConfig,
  VisionConfig,
  TTSConfig,
  STTConfig,
} from '../types/provider.types.js';

const CHAT_MODEL   = 'claude-3-5-haiku-20241022';
const VISION_MODEL = 'claude-3-5-haiku-20241022';

export class AnthropicProvider extends BaseProvider {
  readonly name = 'anthropic';
  readonly supportedTaskTypes: TaskType[] = ['text/chat', 'text/reasoning', 'vision/analyze'];

  qualityRank  = 88;
  currentLoad  = 0;
  region       = 'us-east-1';

  private client: Anthropic;
  private latencyMs = 1300;

  constructor() {
    super();
    this.client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY ?? '' });
  }

  async chat(messages: Message[], config: ChatConfig = {}): Promise<ChatResult> {
    const model = config.model ?? CHAT_MODEL;

    const systemMsg = config.systemPrompt
      ?? messages.find((m) => m.role === 'system')?.content;

    const userMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const res = await this.client.messages.create({
      model,
      max_tokens:  config.maxTokens  ?? 1024,
      system:      systemMsg,
      messages:    userMessages,
      temperature: config.temperature ?? 0.7,
    });

    const block = res.content[0];
    return {
      text:  block?.type === 'text' ? block.text.trim() : '',
      model: res.model,
      usage: {
        prompt_tokens:     res.usage.input_tokens,
        completion_tokens: res.usage.output_tokens,
        total_tokens:      res.usage.input_tokens + res.usage.output_tokens,
      },
    };
  }

  async chatStream(
    messages: Message[],
    config: ChatConfig = {},
    onChunk: (chunk: string) => void,
    onDone:  (usage: TokenUsage) => void,
  ): Promise<void> {
    const model = config.model ?? CHAT_MODEL;

    const systemMsg = config.systemPrompt
      ?? messages.find((m) => m.role === 'system')?.content;

    const userMessages = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    const stream = await this.client.messages.create({
      model,
      max_tokens: config.maxTokens ?? 1024,
      system:     systemMsg,
      messages:   userMessages,
      stream:     true,
    });

    let inputTokens = 0;
    let outputTokens = 0;

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        onChunk(event.delta.text);
      }
      if (event.type === 'message_delta' && event.usage) {
        outputTokens = event.usage.output_tokens ?? 0;
      }
      if (event.type === 'message_start' && event.message.usage) {
        inputTokens = event.message.usage.input_tokens ?? 0;
      }
    }

    onDone({
      prompt_tokens:     inputTokens,
      completion_tokens: outputTokens,
      total_tokens:      inputTokens + outputTokens,
    });
  }

  private detectMimeType(base64: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
    const raw    = base64.startsWith('data:') ? base64.split(',')[1] : base64;
    const header = raw.slice(0, 12);
    if (header.startsWith('iVBORw0KGgo')) return 'image/png';
    if (header.startsWith('R0lGOD'))       return 'image/gif';
    if (header.startsWith('UklGR'))        return 'image/webp';
    return 'image/jpeg';
  }

  async vision(imageBase64: string, prompt: string, config: VisionConfig = {}): Promise<VisionResult> {
    const model      = config.model ?? VISION_MODEL;
    const base64Data = imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64;
    const mediaType  = this.detectMimeType(base64Data);

    const res = await this.client.messages.create({
      model,
      max_tokens: config.maxTokens ?? 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64Data } },
            { type: 'text',  text:   prompt || 'Describe what you see.' },
          ],
        },
      ],
    });

    const block = res.content[0];
    return {
      text:  block?.type === 'text' ? block.text.trim() : '',
      model: res.model,
      usage: {
        prompt_tokens:     res.usage.input_tokens,
        completion_tokens: res.usage.output_tokens,
        total_tokens:      res.usage.input_tokens + res.usage.output_tokens,
      },
    };
  }

  async embed(_texts: string[], _model: string): Promise<number[][]> {
    throw new Error('AnthropicProvider: embeddings not supported — use OpenAI.');
  }

  async tts(_text: string, _config: TTSConfig): Promise<Buffer> {
    throw new Error('AnthropicProvider: TTS not supported.');
  }

  async stt(_audioBuffer: Buffer, _config: STTConfig): Promise<string> {
    throw new Error('AnthropicProvider: STT not supported.');
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env.ANTHROPIC_API_KEY);
  }

  getLatencyEstimate(): number { return this.latencyMs; }

  getCostEstimate(units: number, _taskType: TaskType): number {
    return 0.000025 * units;
  }
}
