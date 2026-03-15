import type { TaskType, TokenUsage } from '../types/gateway.types.js';
import type {
  Message,
  ChatConfig,
  VisionConfig,
  TTSConfig,
  STTConfig,
} from '../types/provider.types.js';

export interface ChatResult {
  text:  string;
  usage: TokenUsage;
  model: string;
}

export interface VisionResult {
  text:  string;
  usage: TokenUsage;
  model: string;
}

/**
 * BaseProvider — Abstract interface all AI provider adapters must implement.
 *
 * Phase 3+ change: chat() and vision() now return ChatResult / VisionResult
 * so token usage is available throughout the pipeline.
 */
export abstract class BaseProvider {
  abstract readonly name: string;
  abstract readonly supportedTaskTypes: TaskType[];

  /** Optional metadata used by SuperRouter strategies */
  qualityRank?: number;
  currentLoad?: number;
  region?: string;

  // ── Core methods ─────────────────────────────────────────────────────────

  abstract chat(messages: Message[], config: ChatConfig): Promise<ChatResult>;

  abstract chatStream(
    messages: Message[],
    config: ChatConfig,
    onChunk: (chunk: string) => void,
    onDone:  (usage: TokenUsage) => void,
  ): Promise<void>;

  abstract vision(
    imageBase64: string,
    prompt:      string,
    config:      VisionConfig,
  ): Promise<VisionResult>;

  abstract embed(texts: string[], model: string): Promise<number[][]>;

  abstract tts(text: string, config: TTSConfig): Promise<Buffer>;

  abstract stt(audioBuffer: Buffer, config: STTConfig): Promise<string>;

  // ── Health & metrics ─────────────────────────────────────────────────────

  abstract isAvailable(): Promise<boolean>;

  abstract getLatencyEstimate(): number;

  abstract getCostEstimate(units: number, taskType: TaskType): number;

  // ── Helpers ───────────────────────────────────────────────────────────────

  protected zeroUsage(): TokenUsage {
    return { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 };
  }
}
