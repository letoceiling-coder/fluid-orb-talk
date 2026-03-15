import type { WebSocket } from '@fastify/websocket';
import { ExecutionEngine } from '../gateway/ExecutionEngine.js';
import type { GatewayRequest } from '../types/gateway.types.js';
import type { ChatChunkEvent, ChatDoneEvent } from './events.js';

/**
 * StreamHandler — Bridges real AI streaming responses to a WebSocket client.
 *
 * Uses ExecutionEngine.executeChatStream() which calls the provider's
 * chatStream() method (OpenAI or Anthropic streaming API).
 */
export class StreamHandler {
  private socket: WebSocket;
  private engine: ExecutionEngine;

  constructor(socket: WebSocket) {
    this.socket   = socket;
    this.engine   = ExecutionEngine.getInstance();
  }

  async streamChat(request: GatewayRequest, sessionId: string): Promise<void> {
    if (this.socket.readyState !== this.socket.OPEN) return;

    try {
      await this.engine.executeChatStream(
        request,
        // onChunk — fired for every text delta
        (chunk, providerName) => {
          const event: ChatChunkEvent = {
            type: 'chat/chunk',
            sessionId,
            chunk,
            provider: providerName,
          };
          this.send(event);
        },
        // onDone — includes token usage from provider
        (providerName, usage) => {
          const event: ChatDoneEvent = {
            type:     'chat/done',
            sessionId,
            provider: providerName,
            usage,
          };
          this.send(event);
        },
        // onError
        (err) => {
          this.send({ type: 'chat/error', sessionId, error: err });
        },
      );
    } catch (err) {
      this.send({
        type:      'chat/error',
        sessionId,
        error:     err instanceof Error ? err.message : 'Stream error',
      });
    }
  }

  send(event: Record<string, unknown>): void {
    if (this.socket.readyState === this.socket.OPEN) {
      this.socket.send(JSON.stringify(event));
    }
  }
}
