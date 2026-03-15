/**
 * Public Gateway Routes (Phase 1-3, no JWT required)
 *
 * Nginx strips /gateway/ prefix:
 *   /gateway/chat    → /chat
 *   /gateway/vision  → /vision
 *   /gateway/image   → /image
 *   /gateway/tts     → /tts
 *   /gateway/stream  → /stream  (WebSocket)
 */
import type { FastifyInstance } from 'fastify';
import { GatewayCore } from '../gateway/GatewayCore.js';
import { ExecutionEngine } from '../gateway/ExecutionEngine.js';
import { WSHub } from '../websocket/WSHub.js';
import { StreamHandler } from '../websocket/StreamHandler.js';
import type { Message } from '../types/provider.types.js';
import { v4 as uuidv4 } from 'uuid';

interface ChatBody {
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  message?:  string;
  model?:    string;
  stream?:   boolean;
}

interface VisionBody {
  imageBase64: string;
  prompt?:     string;
}

interface ImageBody {
  prompt:      string;
  model?:      string;
  width?:      number;
  height?:     number;
  steps?:      number;
}

interface TTSBody {
  text:      string;
  voice?:    string;
  language?: string;
  model?:    string;
}

export async function gatewayRoutes(fastify: FastifyInstance): Promise<void> {
  const gateway = GatewayCore.getInstance();
  const engine  = ExecutionEngine.getInstance();
  const hub     = WSHub.getInstance();

  // ── POST /chat ────────────────────────────────────────────────────────────
  fastify.post<{ Body: ChatBody }>('/chat', async (request, reply) => {
    const { messages, message, model } = request.body;

    const msgArray: Message[] = messages && messages.length > 0
      ? (messages as Message[])
      : message
        ? [{ role: 'user', content: message }]
        : [];

    if (msgArray.length === 0) {
      return reply.code(400).send({ error: 'messages or message is required' });
    }

    try {
      const result = await gateway.handle({
        taskType: 'text/chat',
        payload:  { messages: msgArray, model },
      });

      if (result.success) {
        const dataVal = result.data as Record<string, unknown> | undefined;
        const raw     = dataVal?.response ?? dataVal;
        const text    = typeof raw === 'string' ? raw : JSON.stringify(raw ?? '');
        return reply.send({
          message:  text,
          model:    result.model ?? model ?? 'default',
          provider: result.provider,
          usage:    result.usage ?? null,
        });
      }

      return reply.code(502).send({ error: result.error ?? 'Gateway error' });
    } catch (err) {
      fastify.log.error({ err }, 'Gateway chat error');
      return reply.code(500).send({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  });

  // ── POST /vision ──────────────────────────────────────────────────────────
  fastify.post<{ Body: VisionBody }>('/vision', async (request, reply) => {
    const { imageBase64, prompt = 'Describe what you see in this image in detail.' } = request.body;

    if (!imageBase64) return reply.code(400).send({ error: 'imageBase64 is required' });

    try {
      const result = await gateway.handle({
        taskType: 'vision/analyze',
        payload:  { frame: imageBase64, prompt },
      });

      if (result.success) {
        const data  = result.data as Record<string, unknown> | undefined;
        const raw   = data?.response as Record<string, unknown> | string | undefined;
        const description = typeof raw === 'string'
          ? raw
          : typeof raw === 'object' && raw
            ? String(raw.description ?? raw.text ?? JSON.stringify(raw))
            : 'Analysis complete';
        return reply.send({
          description,
          objects:  (data?.objects ?? []) as string[],
          provider: result.provider,
          model:    result.model,
          usage:    result.usage ?? null,
        });
      }

      return reply.code(502).send({ error: result.error ?? 'Vision error' });
    } catch (err) {
      fastify.log.error({ err }, 'Gateway vision error');
      return reply.code(500).send({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  });

  // ── POST /image ───────────────────────────────────────────────────────────
  fastify.post<{ Body: ImageBody }>('/image', async (request, reply) => {
    const { prompt, model, width, height, steps } = request.body;

    if (!prompt) return reply.code(400).send({ error: 'prompt is required' });

    try {
      const result = await gateway.handle({
        taskType: 'image/generate',
        payload:  { prompt, model, width, height, steps },
      });

      if (result.success) {
        const data = result.data as Record<string, unknown>;
        return reply.send({ url: data.url, prompt: data.prompt, provider: result.provider });
      }

      return reply.code(502).send({ error: result.error ?? 'Image generation error' });
    } catch (err) {
      fastify.log.error({ err }, 'Gateway image error');
      return reply.code(500).send({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  });

  // ── POST /tts ─────────────────────────────────────────────────────────────
  fastify.post<{ Body: TTSBody }>('/tts', async (request, reply) => {
    const { text, voice, language, model } = request.body;

    if (!text) return reply.code(400).send({ error: 'text is required' });

    try {
      const result = await gateway.handle({
        taskType: 'audio/tts',
        payload:  { text, config: { voice, language, model } },
      });

      if (result.success) {
        const data = result.data as Record<string, unknown>;
        const audioB64 = data.audio as string;

        // Return raw MP3 bytes if client accepts audio, else base64 JSON
        const accept = request.headers.accept ?? '';
        if (accept.includes('audio/')) {
          const buf = Buffer.from(audioB64, 'base64');
          return reply
            .header('Content-Type', 'audio/mpeg')
            .header('Content-Length', String(buf.length))
            .send(buf);
        }

        return reply.send({ audio: audioB64, format: 'mp3', provider: result.provider });
      }

      return reply.code(502).send({ error: result.error ?? 'TTS error' });
    } catch (err) {
      fastify.log.error({ err }, 'Gateway TTS error');
      return reply.code(500).send({ error: err instanceof Error ? err.message : 'Internal error' });
    }
  });

  // ── GET /stream — WebSocket streaming endpoint ───────────────────────────
  fastify.get('/stream', { websocket: true }, (socket, request) => {
    const clientId  = hub.addClient(socket as Parameters<typeof hub.addClient>[0]);
    const sessionId = (request.query as Record<string, string>).session ?? uuidv4();

    hub.joinRoom(clientId, `chat:${sessionId}`);

    socket.on('message', async (raw: Buffer | string) => {
      let msg: Record<string, unknown>;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }

      if (msg.type === 'ping') {
        socket.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
        return;
      }

      if (msg.type === 'chat') {
        const sid      = (msg.sessionId as string | undefined) ?? sessionId;
        const messages = msg.messages as Array<{ role: string; content: string }> | undefined;
        const message  = msg.message  as string | undefined;

        const msgArray: Message[] = messages && messages.length > 0
          ? (messages as Message[])
          : message
            ? [{ role: 'user', content: message }]
            : [];

        if (!msgArray.length) {
          socket.send(JSON.stringify({ type: 'chat/error', sessionId: sid, error: 'No messages provided' }));
          return;
        }

        const handler = new StreamHandler(socket as Parameters<typeof StreamHandler['prototype']['send']>[0] extends never ? never : ConstructorParameters<typeof StreamHandler>[0]);
        await handler.streamChat(
          { taskType: 'text/chat', payload: { messages: msgArray, model: msg.model as string | undefined } },
          sid,
        );
      }

      if (msg.type === 'join_room') {
        hub.joinRoom(clientId, String(msg.room));
      }

      if (msg.type === 'leave_room') {
        hub.leaveRoom(clientId, String(msg.room));
      }
    });

    socket.on('close', () => hub.removeClient(clientId));
  });
}
