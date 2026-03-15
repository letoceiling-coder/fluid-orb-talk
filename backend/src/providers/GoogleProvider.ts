import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { BaseProvider } from './BaseProvider.js';
import type { TaskType } from '../types/gateway.types.js';
import type {
  Message,
  ChatConfig,
  VisionConfig,
  TTSConfig,
  STTConfig,
} from '../types/provider.types.js';

const CHAT_MODEL   = 'gemini-2.0-flash';
const VISION_MODEL = 'gemini-2.0-flash';

const SAFETY = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT,        threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,       threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export class GoogleProvider extends BaseProvider {
  readonly name = 'google';
  readonly supportedTaskTypes: TaskType[] = ['text/chat', 'text/reasoning', 'vision/analyze', 'embed'];

  qualityRank  = 85;
  currentLoad  = 0;
  region       = 'us-central1';

  private genAI: GoogleGenerativeAI;
  private latencyMs = 900;

  constructor() {
    super();
    this.genAI = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY ?? '');
  }

  async chat(messages: Message[], config: ChatConfig = {}): Promise<string> {
    const modelName = config.model ?? CHAT_MODEL;
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      safetySettings: SAFETY,
      generationConfig: {
        temperature:     config.temperature ?? 0.7,
        maxOutputTokens: config.maxTokens   ?? 1024,
        topP:            config.topP        ?? 1,
      },
    });

    const systemPrompt = config.systemPrompt
      ?? messages.find((m) => m.role === 'system')?.content;

    const history = messages
      .filter((m) => m.role !== 'system')
      .slice(0, -1)
      .map((m) => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const lastMsg = messages.filter((m) => m.role !== 'system').at(-1);
    const userText = lastMsg?.content ?? '';

    const chat = model.startChat({
      history,
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }], role: 'user' } : undefined,
    });

    const result = await chat.sendMessage(userText);
    return result.response.text().trim();
  }

  async chatStream(
    messages: Message[],
    config: ChatConfig = {},
    onChunk: (chunk: string) => void,
    onDone: () => void,
  ): Promise<void> {
    const modelName = config.model ?? CHAT_MODEL;
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      safetySettings: SAFETY,
      generationConfig: {
        temperature:     config.temperature ?? 0.7,
        maxOutputTokens: config.maxTokens   ?? 1024,
      },
    });

    const systemPrompt = config.systemPrompt
      ?? messages.find((m) => m.role === 'system')?.content;

    const history = messages
      .filter((m) => m.role !== 'system')
      .slice(0, -1)
      .map((m) => ({
        role:  m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    const lastMsg = messages.filter((m) => m.role !== 'system').at(-1);

    const chat = model.startChat({
      history,
      systemInstruction: systemPrompt ? { parts: [{ text: systemPrompt }], role: 'user' } : undefined,
    });

    const result = await chat.sendMessageStream(lastMsg?.content ?? '');
    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) onChunk(text);
    }
    onDone();
  }

  private detectMimeType(base64: string): 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp' {
    const raw = base64.startsWith('data:') ? base64.split(',')[1] : base64;
    const header = raw.slice(0, 12);
    if (header.startsWith('iVBORw0KGgo')) return 'image/png';
    if (header.startsWith('R0lGOD'))       return 'image/gif';
    if (header.startsWith('UklGR'))        return 'image/webp';
    return 'image/jpeg';
  }

  async vision(imageBase64: string, prompt: string, config: VisionConfig = {}): Promise<string> {
    const modelName = config.model ?? VISION_MODEL;
    const model = this.genAI.getGenerativeModel({
      model: modelName,
      safetySettings: SAFETY,
      generationConfig: { maxOutputTokens: config.maxTokens ?? 1024 },
    });

    const base64Data = imageBase64.startsWith('data:')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const mimeType = this.detectMimeType(base64Data);

    const result = await model.generateContent([
      prompt || 'Describe what you see in this image.',
      { inlineData: { mimeType, data: base64Data } },
    ]);

    return result.response.text().trim();
  }

  async embed(texts: string[], _model?: string): Promise<number[][]> {
    const model = this.genAI.getGenerativeModel({ model: 'text-embedding-004' });
    const results: number[][] = [];
    for (const text of texts) {
      const res = await model.embedContent(text);
      results.push(res.embedding.values);
    }
    return results;
  }

  async tts(_text: string, _config: TTSConfig): Promise<Buffer> {
    throw new Error('GoogleProvider: TTS not supported — use ElevenLabs.');
  }

  async stt(_audioBuffer: Buffer, _config: STTConfig): Promise<string> {
    throw new Error('GoogleProvider: STT not yet implemented.');
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env.GOOGLE_API_KEY);
  }

  getLatencyEstimate(): number { return this.latencyMs; }

  getCostEstimate(units: number, _taskType: TaskType): number {
    return 0.000007 * units;
  }
}
