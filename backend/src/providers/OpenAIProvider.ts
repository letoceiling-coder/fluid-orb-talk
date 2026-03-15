import OpenAI from 'openai';
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

const CHAT_MODEL   = 'gpt-4o-mini';
const VISION_MODEL = 'gpt-4o-mini';
const EMBED_MODEL  = 'text-embedding-3-small';
const TTS_MODEL    = 'tts-1';
const STT_MODEL    = 'whisper-1';

export class OpenAIProvider extends BaseProvider {
  readonly name = 'openai';
  readonly supportedTaskTypes: TaskType[] = [
    'text/chat',
    'text/reasoning',
    'vision/analyze',
    'embed',
    'audio/tts',
    'audio/stt',
  ];

  qualityRank  = 90;
  currentLoad  = 0;
  region       = 'us-east-1';

  private client: OpenAI;
  private latencyMs = 1100;

  constructor() {
    super();
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY ?? '' });
  }

  async chat(messages: Message[], config: ChatConfig = {}): Promise<ChatResult> {
    const model = config.model ?? CHAT_MODEL;

    const oaiMessages = messages.map((m) => ({
      role:    m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    if (config.systemPrompt) {
      oaiMessages.unshift({ role: 'system', content: config.systemPrompt });
    }

    const res = await this.client.chat.completions.create({
      model,
      messages:    oaiMessages,
      temperature: config.temperature ?? 0.7,
      max_tokens:  config.maxTokens   ?? 1024,
      top_p:       config.topP        ?? 1,
    });

    const u = res.usage;
    return {
      text:  res.choices[0]?.message?.content?.trim() ?? '',
      model: res.model,
      usage: {
        prompt_tokens:     u?.prompt_tokens     ?? 0,
        completion_tokens: u?.completion_tokens ?? 0,
        total_tokens:      u?.total_tokens      ?? 0,
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

    const oaiMessages = messages.map((m) => ({
      role:    m.role as 'system' | 'user' | 'assistant',
      content: m.content,
    }));

    if (config.systemPrompt) {
      oaiMessages.unshift({ role: 'system', content: config.systemPrompt });
    }

    const stream = await this.client.chat.completions.create({
      model,
      messages:    oaiMessages,
      temperature: config.temperature ?? 0.7,
      max_tokens:  config.maxTokens   ?? 1024,
      stream:      true,
      stream_options: { include_usage: true },
    });

    let usage: TokenUsage = this.zeroUsage();

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta?.content;
      if (delta) onChunk(delta);
      // Final chunk carries usage when stream_options.include_usage = true
      if (chunk.usage) {
        usage = {
          prompt_tokens:     chunk.usage.prompt_tokens     ?? 0,
          completion_tokens: chunk.usage.completion_tokens ?? 0,
          total_tokens:      chunk.usage.total_tokens      ?? 0,
        };
      }
    }

    onDone(usage);
  }

  private detectMimeType(base64: string): string {
    const raw    = base64.startsWith('data:') ? base64.split(',')[1] : base64;
    const header = raw.slice(0, 12);
    if (header.startsWith('iVBORw0KGgo')) return 'image/png';
    if (header.startsWith('/9j/'))         return 'image/jpeg';
    if (header.startsWith('R0lGOD'))       return 'image/gif';
    if (header.startsWith('UklGR'))        return 'image/webp';
    return 'image/jpeg';
  }

  async vision(imageBase64: string, prompt: string, config: VisionConfig = {}): Promise<VisionResult> {
    const model   = config.model ?? VISION_MODEL;
    const raw     = imageBase64.startsWith('data:') ? imageBase64.split(',')[1] : imageBase64;
    const mime    = this.detectMimeType(raw);
    const imgUrl  = `data:${mime};base64,${raw}`;

    const res = await this.client.chat.completions.create({
      model,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text',      text:      prompt || 'Describe what you see in this image.' },
            { type: 'image_url', image_url: { url: imgUrl, detail: config.detail ?? 'auto' } },
          ],
        },
      ],
      max_tokens: config.maxTokens ?? 1024,
    });

    const u = res.usage;
    return {
      text:  res.choices[0]?.message?.content?.trim() ?? '',
      model: res.model,
      usage: {
        prompt_tokens:     u?.prompt_tokens     ?? 0,
        completion_tokens: u?.completion_tokens ?? 0,
        total_tokens:      u?.total_tokens      ?? 0,
      },
    };
  }

  async embed(texts: string[], model = EMBED_MODEL): Promise<number[][]> {
    const res = await this.client.embeddings.create({ model, input: texts });
    return res.data.map((d) => d.embedding);
  }

  async tts(text: string, config: TTSConfig = {}): Promise<Buffer> {
    const res = await this.client.audio.speech.create({
      model:  config.model ?? TTS_MODEL,
      voice:  (config.voice as 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer') ?? 'alloy',
      input:  text,
      speed:  config.speed ?? 1,
    });
    const arrayBuffer = await res.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  async stt(audioBuffer: Buffer, config: STTConfig = {}): Promise<string> {
    const blob = new Blob([new Uint8Array(audioBuffer)], { type: 'audio/webm' });
    const file = new File([blob], 'audio.webm', { type: 'audio/webm' });
    const res = await this.client.audio.transcriptions.create({
      model:    config.model ?? STT_MODEL,
      file,
      language: config.language,
      prompt:   config.prompt,
    });
    return res.text;
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env.OPENAI_API_KEY);
  }

  getLatencyEstimate(): number { return this.latencyMs; }

  getCostEstimate(units: number, taskType: TaskType): number {
    const rates: Partial<Record<TaskType, number>> = {
      'text/chat':    0.00003,
      'embed':        0.0000001,
      'audio/tts':    0.000015,
      'audio/stt':    0.000006,
      'vision/analyze': 0.0001,
    };
    return (rates[taskType] ?? 0.00003) * units;
  }
}
