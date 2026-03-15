import { SuperRouter } from './SuperRouter.js';
import type { BaseProvider } from '../providers/BaseProvider.js';
import type { GatewayRequest, GatewayResponse, TaskType } from '../types/gateway.types.js';
import type { Message } from '../types/provider.types.js';

/**
 * ExecutionEngine — Executes AI tasks with automatic provider fallback.
 *
 * Fallback chain (Phase 2):
 *   chat/vision: openai → anthropic → google
 *   embed:       openai → google
 *   tts/stt:     openai
 */
export class ExecutionEngine {
  private static instance: ExecutionEngine;
  private router: SuperRouter;

  private constructor() {
    this.router = SuperRouter.getInstance();
  }

  static getInstance(): ExecutionEngine {
    if (!ExecutionEngine.instance) {
      ExecutionEngine.instance = new ExecutionEngine();
    }
    return ExecutionEngine.instance;
  }

  async execute(request: GatewayRequest, _primaryProvider: BaseProvider): Promise<GatewayResponse> {
    // Always use fallback chain — ignore pre-selected provider so the chain is authoritative
    const chain = this.router.getFallbackChain(request.taskType);
    const errors: string[] = [];

    for (const provider of chain) {
      try {
        const available = await provider.isAvailable();
        if (!available) {
          errors.push(`${provider.name}: API key not configured`);
          continue;
        }

        const result = await this.dispatch(request, provider);
        result.provider = provider.name;
        return result;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        errors.push(`${provider.name}: ${msg}`);
        console.warn(`[ExecutionEngine] ${provider.name} failed — trying next. Error: ${msg}`);
      }
    }

    return {
      success:  false,
      provider: 'none',
      taskType: request.taskType,
      error:    `All providers failed:\n${errors.join('\n')}`,
    };
  }

  // ── Task dispatcher ───────────────────────────────────────────────────────

  private async dispatch(request: GatewayRequest, provider: BaseProvider): Promise<GatewayResponse> {
    switch (request.taskType) {
      case 'text/chat':
      case 'text/reasoning':
        return this.executeChat(request, provider);

      case 'vision/analyze':
        return this.executeVision(request, provider);

      case 'image/generate':
        return this.executeImage(request, provider);

      case 'video/generate':
        return this.executeVideo(request, provider);

      case 'audio/tts':
      case 'audio/stt':
        return this.executeAudio(request, provider);

      case 'embed':
        return this.executeEmbed(request, provider);

      default:
        throw new Error(`ExecutionEngine: unsupported task "${request.taskType}"`);
    }
  }

  // ── Chat ─────────────────────────────────────────────────────────────────

  private async executeChat(request: GatewayRequest, provider: BaseProvider): Promise<GatewayResponse> {
    const payload = request.payload as {
      messages?: Message[];
      message?: string;
      model?: string;
      config?: Record<string, unknown>;
    };

    let messages: Message[] = Array.isArray(payload.messages)
      ? payload.messages
      : [];

    // Support simple { message: "..." } shorthand
    if (messages.length === 0 && payload.message) {
      messages = [{ role: 'user', content: String(payload.message) }];
    }

    if (messages.length === 0) {
      throw new Error('executeChat: messages array is empty');
    }

    const config = {
      model:       (payload.model as string | undefined) ?? undefined,
      temperature: (payload.config?.temperature as number | undefined),
      maxTokens:   (payload.config?.maxTokens   as number | undefined),
      systemPrompt: (payload.config?.systemPrompt as string | undefined),
    };

    const text = await provider.chat(messages, config);

    return {
      success:  true,
      provider: provider.name,
      taskType: request.taskType,
      data:     { response: text },
    };
  }

  // ── Vision ────────────────────────────────────────────────────────────────

  private async executeVision(request: GatewayRequest, provider: BaseProvider): Promise<GatewayResponse> {
    const { frame, prompt, config } = request.payload as {
      frame:   string;
      prompt?: string;
      config?: Record<string, unknown>;
    };

    const description = await provider.vision(
      frame,
      prompt ?? 'Describe what you see in this image in detail.',
      {
        model:     (config?.model as string | undefined),
        detail:    (config?.detail as 'low' | 'high' | 'auto' | undefined) ?? 'auto',
        maxTokens: (config?.maxTokens as number | undefined) ?? 1024,
      },
    );

    return {
      success:  true,
      provider: provider.name,
      taskType: request.taskType,
      data:     { response: description },
    };
  }

  // ── Image generation ─────────────────────────────────────────────────────

  private async executeImage(_request: GatewayRequest, provider: BaseProvider): Promise<GatewayResponse> {
    return {
      success:  true,
      provider: provider.name,
      taskType: _request.taskType,
      data:     { message: 'Image generation coming in Phase 3' },
    };
  }

  // ── Video generation ─────────────────────────────────────────────────────

  private async executeVideo(_request: GatewayRequest, provider: BaseProvider): Promise<GatewayResponse> {
    return {
      success:  true,
      provider: provider.name,
      taskType: _request.taskType,
      data:     { message: 'Video generation coming in Phase 3' },
    };
  }

  // ── Audio (TTS / STT) ────────────────────────────────────────────────────

  private async executeAudio(request: GatewayRequest, provider: BaseProvider): Promise<GatewayResponse> {
    if (request.taskType === 'audio/tts') {
      const { text, config } = request.payload as { text: string; config?: Record<string, unknown> };
      const audio = await provider.tts(text, {
        voice:    config?.voice as string | undefined,
        language: config?.language as string | undefined,
        speed:    config?.speed as number | undefined,
      });
      return {
        success:  true,
        provider: provider.name,
        taskType: request.taskType,
        data:     { audio: audio.toString('base64') },
      };
    }

    // STT
    const { audioBase64 } = request.payload as { audioBase64: string };
    const buffer = Buffer.from(audioBase64, 'base64');
    const transcript = await provider.stt(buffer, {});
    return {
      success:  true,
      provider: provider.name,
      taskType: request.taskType,
      data:     { transcript },
    };
  }

  // ── Embeddings ────────────────────────────────────────────────────────────

  private async executeEmbed(request: GatewayRequest, provider: BaseProvider): Promise<GatewayResponse> {
    const texts = request.payload.texts as string[];
    const model = request.payload.model as string | undefined;
    const embeddings = await provider.embed(texts, model ?? 'text-embedding-3-small');
    return {
      success:  true,
      provider: provider.name,
      taskType: request.taskType,
      data:     { embeddings },
    };
  }
}
