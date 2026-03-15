import type {
  AnyStreamEvent,
  ChatAckEvent,
  ChatChunkEvent,
  ChatDoneEvent,
  ChatErrorEvent,
  SessionStateEvent,
  StreamEventType,
} from '@/types/stream.events';

type EventHandler<T extends AnyStreamEvent> = (event: T) => void;

export interface StreamingControllerOptions {
  url: string;
  session_id: string;
  reconnect?: boolean;
  max_reconnect_attempts?: number;
  reconnect_delay_ms?: number;
}

export interface StreamingHandlers {
  onChatAck?: EventHandler<ChatAckEvent>;
  onChatChunk?: EventHandler<ChatChunkEvent>;
  onChatDone?: EventHandler<ChatDoneEvent>;
  onChatError?: EventHandler<ChatErrorEvent>;
  onSessionState?: EventHandler<SessionStateEvent>;
  onOpen?: () => void;
  onClose?: () => void;
}

function nowIso(): string {
  return new Date().toISOString();
}

export class StreamingController {
  private socket: WebSocket | null = null;
  private opts: StreamingControllerOptions | null = null;
  private handlers: StreamingHandlers = {};
  private reconnectAttempts = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingTurn = false;

  connect(options: StreamingControllerOptions, handlers: StreamingHandlers = {}): void {
    this.opts = {
      reconnect: true,
      max_reconnect_attempts: 5,
      reconnect_delay_ms: 1000,
      ...options,
    };
    this.handlers = handlers;
    this.openSocket();
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
    this.pendingTurn = false;
    this.socket?.close();
    this.socket = null;
  }

  send<T extends Record<string, unknown>>(event: T): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new Error('[StreamingController] Cannot send message: socket is not open');
    }
    this.socket.send(JSON.stringify(event));
  }

  get connected(): boolean {
    return !!this.socket && this.socket.readyState === WebSocket.OPEN;
  }

  private openSocket(): void {
    if (!this.opts) throw new Error('[StreamingController] Missing connection options');

    this.socket?.close();
    this.socket = new WebSocket(this.opts.url);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.handlers.onOpen?.();
      console.log('[StreamingController] WebSocket connected', {
        session_id: this.opts?.session_id,
      });
    };

    this.socket.onmessage = (raw) => {
      const parsed = this.parseEvent(raw.data);
      if (!parsed) return;
      this.dispatch(parsed);
    };

    this.socket.onerror = () => {
      console.error('[StreamingController] WebSocket error');
    };

    this.socket.onclose = () => {
      this.handlers.onClose?.();
      console.warn('[StreamingController] WebSocket closed');

      // Prevent UI deadlocks by forcing terminal error when stream closes mid-turn.
      if (this.pendingTurn && this.opts) {
        this.pendingTurn = false;
        this.handlers.onChatError?.({
          type: 'chat/error',
          session_id: this.opts.session_id,
          timestamp: nowIso(),
          payload: {
            error: 'Streaming connection closed before completion',
            code: 'STREAM_CLOSED',
            retryable: true,
          },
        });
      }

      if (this.opts?.reconnect) this.scheduleReconnect();
    };
  }

  private scheduleReconnect(): void {
    if (!this.opts) return;
    const max = this.opts.max_reconnect_attempts ?? 5;
    if (this.reconnectAttempts >= max) return;

    this.reconnectAttempts += 1;
    const delay = this.opts.reconnect_delay_ms ?? 1000;
    this.reconnectTimer = setTimeout(() => this.openSocket(), delay);
  }

  private dispatch(event: AnyStreamEvent): void {
    switch (event.type) {
      case 'chat/ack':
        this.pendingTurn = true;
        this.handlers.onChatAck?.(event);
        return;
      case 'chat/chunk':
        this.pendingTurn = true;
        this.handlers.onChatChunk?.(event);
        return;
      case 'chat/done':
        this.pendingTurn = false;
        this.handlers.onChatDone?.(event);
        return;
      case 'chat/error':
        this.pendingTurn = false;
        this.handlers.onChatError?.(event);
        return;
      case 'session/state':
        this.handlers.onSessionState?.(event);
        return;
      case 'ping':
        this.send({
          type: 'pong',
          session_id: event.session_id,
          timestamp: nowIso(),
          payload: { ts: Date.now() },
        });
        return;
      case 'pong':
      default:
        return;
    }
  }

  private parseEvent(raw: unknown): AnyStreamEvent | null {
    try {
      const data = typeof raw === 'string' ? JSON.parse(raw) as Record<string, unknown> : null;
      if (!data || typeof data.type !== 'string') return null;

      // Supports both { payload: {...} } and flat event shape from existing backend.
      const type = data.type as StreamEventType;
      const session_id = String((data.session_id ?? data.sessionId ?? this.opts?.session_id ?? ''));
      const timestamp = typeof data.timestamp === 'string' ? data.timestamp : nowIso();
      const trace_id = typeof data.trace_id === 'string' ? data.trace_id : undefined;

      if (type === 'chat/chunk') {
        return {
          type,
          session_id,
          timestamp,
          trace_id,
          payload: {
            delta: String((data.payload as any)?.delta ?? data.chunk ?? ''),
            index: Number((data.payload as any)?.index ?? 0),
          },
        };
      }

      if (type === 'chat/done') {
        return {
          type,
          session_id,
          timestamp,
          trace_id,
          payload: {
            content: String((data.payload as any)?.content ?? ''),
            provider: (data.payload as any)?.provider ?? data.provider,
            model: (data.payload as any)?.model ?? data.model,
            usage: (data.payload as any)?.usage ?? data.usage,
            latency_ms: (data.payload as any)?.latency_ms ?? data.latency_ms,
          },
        };
      }

      if (type === 'chat/error') {
        return {
          type,
          session_id,
          timestamp,
          trace_id,
          payload: {
            error: String((data.payload as any)?.error ?? data.error ?? 'Unknown stream error'),
            code: (data.payload as any)?.code,
            retryable: (data.payload as any)?.retryable,
          },
        };
      }

      if (type === 'chat/ack') {
        return {
          type,
          session_id,
          timestamp,
          trace_id,
          payload: {
            provider: (data.payload as any)?.provider ?? data.provider,
            model: (data.payload as any)?.model ?? data.model,
          },
        };
      }

      if (type === 'session/state') {
        return {
          type,
          session_id,
          timestamp,
          trace_id,
          payload: {
            state: String((data.payload as any)?.state ?? data.state) as any,
          },
        };
      }

      if (type === 'ping' || type === 'pong') {
        return {
          type,
          session_id,
          timestamp,
          trace_id,
          payload: {
            ts: Number((data.payload as any)?.ts ?? Date.now()),
          },
        };
      }

      return null;
    } catch {
      return null;
    }
  }
}

