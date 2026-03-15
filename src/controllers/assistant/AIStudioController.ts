import { assistantService, type ChatMessage, type ChatResponse } from '@/services/AssistantService';
import type { AssistantSession } from '@/types/assistant-runtime.types';
import type { ChatDoneEvent, ChatErrorEvent } from '@/types/stream.events';
import { sessionController, type SessionController } from '@/controllers/runtime/SessionController';
import { assistantStateController, type AssistantStateController } from '@/controllers/runtime/AssistantStateController';
import { StreamingController } from '@/controllers/runtime/StreamingController';

export interface SendMessageOptions {
  messages: ChatMessage[];
  model?: string;
}

export interface StreamMessageOptions extends SendMessageOptions {
  onChunk: (delta: string) => void;
  onDone: (result: {
    content: string;
    provider?: string;
    model?: string;
    usage?: ChatResponse['usage'];
  }) => void;
  onError: (error: string) => void;
}

export class AIStudioController {
  private session: AssistantSession | null = null;
  private readonly streaming = new StreamingController();

  constructor(
    private readonly sessions: SessionController = sessionController,
    private readonly states: AssistantStateController = assistantStateController,
  ) {}

  initialize(session_id?: string): AssistantSession {
    const existing = session_id ? this.sessions.getSession(session_id) : null;
    this.session = existing ?? this.sessions.createSession('ai_studio', { session_id });

    if (this.session.state === 'INIT') {
      this.states.transition(this.session.session_id, 'IDLE', 'initialize');
      this.session = this.sessions.getSession(this.session.session_id);
    }

    if (!this.session) {
      throw new Error('[AIStudioController] Failed to initialize session');
    }
    return this.session;
  }

  getSession(): AssistantSession | null {
    return this.session;
  }

  async sendMessage(text: string, options: SendMessageOptions): Promise<ChatResponse> {
    this.ensureSession();

    const content = text.trim();
    if (!content) throw new Error('Message text is required');

    this.transitionToSending('SENDING_HTTP');

    try {
      const request = this.sessions.propagateSessionId(this.session!.session_id, {
        messages: options.messages,
        model: options.model,
      });

      const response = await assistantService.sendMessage(
        request.messages,
        { model: request.model, session_id: request.session_id } as unknown as { model?: string; stream?: boolean },
      );

      this.states.transition(this.session!.session_id, 'RECEIVED', 'http message received');
      this.states.transition(this.session!.session_id, 'IDLE', 'return to idle');
      return response;
    } catch (error) {
      this.handleError(error);
      throw error;
    }
  }

  streamMessage(text: string, options: StreamMessageOptions): void {
    this.ensureSession();

    const content = text.trim();
    if (!content) throw new Error('Message text is required');

    this.transitionToSending('SENDING_WS');

    const session_id = this.session!.session_id;
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const url = `${proto}//${window.location.host}/gateway/stream`;

    let accumulated = '';

    this.streaming.disconnect();
    this.streaming.connect(
      { url, session_id, reconnect: true },
      {
        onOpen: () => {
          this.states.transition(session_id, 'STREAMING', 'websocket opened');
          const payload = this.sessions.propagateSessionId(session_id, {
            type: 'chat',
            sessionId: session_id,
            messages: options.messages,
            model: options.model,
          });
          this.streaming.send(payload);
        },
        onChatChunk: (event) => {
          accumulated += event.payload.delta;
          options.onChunk(event.payload.delta);
        },
        onChatDone: (event: ChatDoneEvent) => {
          this.states.transition(session_id, 'RECEIVED', 'stream completed');
          this.states.transition(session_id, 'IDLE', 'return to idle');
          options.onDone({
            content: accumulated || event.payload.content,
            provider: event.payload.provider,
            model: event.payload.model,
            usage: event.payload.usage,
          });
        },
        onChatError: (event: ChatErrorEvent) => {
          this.handleError(event.payload.error);
          options.onError(event.payload.error);
        },
      },
    );
  }

  resetConversation(): AssistantSession {
    this.ensureSession();
    const current = this.session!;

    try {
      this.states.transition(current.session_id, 'RESETTING', 'reset conversation');
    } catch {
      // Reset must proceed even if state is not currently transitionable to RESETTING.
    }

    this.streaming.disconnect();
    this.sessions.endSession(current.session_id);

    this.session = this.sessions.createSession('ai_studio');
    this.states.transition(this.session.session_id, 'IDLE', 'new conversation');
    return this.session;
  }

  handleError(error: unknown): void {
    if (!this.session) return;
    const message = error instanceof Error ? error.message : String(error);

    try {
      this.states.transition(this.session.session_id, 'ERROR', message);
    } catch {
      // Ignore transition errors while handling failures.
    }

    // Telemetry emission (console-based for Phase 2).
    console.error('[AIStudioController] telemetry.error', {
      session_id: this.session.session_id,
      assistant_type: 'ai_studio',
      error: message,
      timestamp: new Date().toISOString(),
    });
  }

  destroy(): void {
    this.streaming.disconnect();
  }

  private ensureSession(): void {
    if (!this.session) this.initialize();
  }

  private transitionToSending(target: 'SENDING_HTTP' | 'SENDING_WS'): void {
    const session_id = this.session!.session_id;
    const current = this.states.getState(session_id);

    if (current === 'IDLE') {
      this.states.transition(session_id, 'COMPOSING', 'prepare message');
    }
    this.states.transition(session_id, target, `dispatch ${target === 'SENDING_HTTP' ? 'http' : 'ws'} request`);
  }
}

