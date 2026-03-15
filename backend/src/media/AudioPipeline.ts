import { ProviderRegistry } from '../providers/ProviderRegistry.js';
import type { ElevenLabsProvider } from '../providers/ElevenLabsProvider.js';
import type { OpenAIProvider } from '../providers/OpenAIProvider.js';

export interface TTSConfig {
  voice?: string;
  language?: string;
  speed?: number;
  format?: 'mp3' | 'pcm' | 'wav';
}

export interface STTConfig {
  language?: string;
  model?: string;
}

export interface MusicGenerationConfig {
  prompt: string;
  durationSeconds?: number;
  style?: string;
}

/**
 * AudioPipeline — Handles all audio processing tasks.
 *
 * Supported operations (Phase 4):
 *   - Text-to-Speech (ElevenLabs, OpenAI TTS)
 *   - Speech-to-Text (OpenAI Whisper)
 *   - Music generation (MusicGen)
 */
export class AudioPipeline {
  private static instance: AudioPipeline;
  private registry: ProviderRegistry;

  private constructor() {
    this.registry = ProviderRegistry.getInstance();
  }

  static getInstance(): AudioPipeline {
    if (!AudioPipeline.instance) {
      AudioPipeline.instance = new AudioPipeline();
    }
    return AudioPipeline.instance;
  }

  async tts(text: string, config: TTSConfig = {}): Promise<Buffer> {
    // TODO Phase 4: prefer ElevenLabs, fallback to OpenAI TTS
    const provider = this.registry.getProvider('elevenlabs') as unknown as ElevenLabsProvider;
    return provider.tts(text, config);
  }

  async stt(audioBuffer: Buffer, config: STTConfig = {}): Promise<string> {
    // TODO Phase 4: use OpenAI Whisper
    const provider = this.registry.getProvider('openai') as OpenAIProvider;
    return provider.stt(audioBuffer, config);
  }

  async generateMusic(config: MusicGenerationConfig): Promise<string> {
    // TODO Phase 4: call MusicGen via Replicate
    return `[AudioPipeline stub] Music URL for prompt: "${config.prompt.slice(0, 50)}"`;
  }

  async transcribeAndTranslate(audioBuffer: Buffer, targetLanguage: string): Promise<string> {
    // TODO Phase 4: Whisper transcription + translation
    return `[AudioPipeline stub] Translated transcript to ${targetLanguage}`;
  }
}
