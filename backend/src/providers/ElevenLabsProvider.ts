import { ElevenLabsClient } from 'elevenlabs';
import { BaseProvider } from './BaseProvider.js';
import type { TaskType } from '../types/gateway.types.js';
import type {
  Message,
  ChatConfig,
  VisionConfig,
  TTSConfig,
  STTConfig,
} from '../types/provider.types.js';

/**
 * Default voice IDs from ElevenLabs (pre-made voices)
 * Rachel: 21m00Tcm4TlvDq8ikWAM — English, warm female
 * Bella:  EXAVITQu4vr4xnSDxMaL — English, soft female
 * Antoni: ErXwobaYiN019PkySvjV — English, warm male
 * Domi:   AZnzlk1XvdvUeBnXmlld — Russian-compatible multilingual
 */
const DEFAULT_VOICE_ID = '21m00Tcm4TlvDq8ikWAM';   // Rachel
const MULTILINGUAL_MODEL = 'eleven_multilingual_v2';
const TURBO_MODEL        = 'eleven_turbo_v2_5';

export class ElevenLabsProvider extends BaseProvider {
  readonly name = 'elevenlabs';
  readonly supportedTaskTypes: TaskType[] = ['audio/tts'];

  qualityRank  = 95;
  currentLoad  = 0;
  region       = 'us-east-1';

  private client: ElevenLabsClient;
  private latencyMs = 800;

  constructor() {
    super();
    this.client = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY ?? '',
    });
  }

  async tts(text: string, config: TTSConfig = {}): Promise<Buffer> {
    const voiceId = config.voice ?? DEFAULT_VOICE_ID;
    const modelId = config.model ?? (config.language && config.language !== 'en'
      ? MULTILINGUAL_MODEL
      : TURBO_MODEL);

    const stream = await this.client.textToSpeech.convert(voiceId, {
      text,
      model_id:      modelId,
      output_format: 'mp3_44100_128',
    });

    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer>) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }

    return Buffer.concat(chunks);
  }

  /** Generate audio and stream chunks to caller */
  async ttsStream(
    text: string,
    config: TTSConfig = {},
    onChunk: (chunk: Buffer) => void,
    onDone: () => void,
  ): Promise<void> {
    const voiceId = config.voice ?? DEFAULT_VOICE_ID;
    const modelId = config.model ?? MULTILINGUAL_MODEL;

    const stream = await this.client.textToSpeech.convert(voiceId, {
      text,
      model_id:      modelId,
      output_format: 'mp3_44100_128',
    });

    for await (const chunk of stream as AsyncIterable<Buffer>) {
      onChunk(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    onDone();
  }

  /** List available voices */
  async getVoices(): Promise<Array<{ voice_id: string; name: string }>> {
    const res = await this.client.voices.getAll();
    return res.voices.map((v) => ({ voice_id: v.voice_id, name: v.name ?? '' }));
  }

  async chat(_messages: Message[], _config: ChatConfig): Promise<string> {
    throw new Error('ElevenLabsProvider: chat not supported.');
  }

  async chatStream(
    _messages: Message[],
    _config: ChatConfig,
    _onChunk: (chunk: string) => void,
    _onDone: () => void,
  ): Promise<void> {
    throw new Error('ElevenLabsProvider: chatStream not supported.');
  }

  async vision(_imageBase64: string, _prompt: string, _config: VisionConfig): Promise<string> {
    throw new Error('ElevenLabsProvider: vision not supported.');
  }

  async embed(_texts: string[], _model: string): Promise<number[][]> {
    throw new Error('ElevenLabsProvider: embed not supported.');
  }

  async stt(_audioBuffer: Buffer, _config: STTConfig): Promise<string> {
    throw new Error('ElevenLabsProvider: STT not supported. Use OpenAI Whisper.');
  }

  async isAvailable(): Promise<boolean> {
    return Boolean(process.env.ELEVENLABS_API_KEY);
  }

  getLatencyEstimate(): number { return this.latencyMs; }

  getCostEstimate(units: number, _taskType: TaskType): number {
    return 0.000015 * units;
  }
}
