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
import { PostgresClient } from '../db/PostgresClient.js';
import { z } from 'zod';
import { RedisRateLimiter } from '../security/RedisRateLimiter.js';

interface ChatBody {
  messages?: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  message?:  string;
  conversation_id?: string;
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

const MAX_MESSAGE_CHARS = 20_000;

const chatBodySchema = z.object({
  conversation_id: z.string().uuid().optional(),
  message: z.string().max(MAX_MESSAGE_CHARS).optional(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant', 'system']),
      content: z.string().max(MAX_MESSAGE_CHARS),
    }),
  ).optional(),
  model: z.string().max(200).optional(),
  stream: z.boolean().optional(),
}).refine((v) => Boolean(v.message) || Boolean(v.messages && v.messages.length > 0), {
  message: 'messages or message is required',
});

const conversationPageSize = 20;

export async function gatewayRoutes(fastify: FastifyInstance): Promise<void> {
  const gateway = GatewayCore.getInstance();
  const engine  = ExecutionEngine.getInstance();
  const hub     = WSHub.getInstance();
  const pg      = PostgresClient.getInstance();
  const rateLimiter = RedisRateLimiter.getInstance();

  const verifyGatewayAccess = async (request: any, reply: any): Promise<void> => {
    const apiKey = request.headers['x-api-key'] as string | undefined;
    const configuredApiKey = process.env.GATEWAY_API_KEY;

    if (apiKey && configuredApiKey && apiKey === configuredApiKey) {
      request.user = { userId: 'gateway_api_key', role: 'service' };
      return;
    }

    try {
      await request.jwtVerify();
      return;
    } catch {
      reply.code(401).send({ error: 'Unauthorized' });
    }
  };

  // ── POST /chat ────────────────────────────────────────────────────────────
  fastify.post<{ Body: ChatBody }>('/chat', {
    preHandler: [verifyGatewayAccess, rateLimiter.middleware(60, 'gateway:chat')],
  }, async (request, reply) => {
    const parsed = chatBodySchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: parsed.error.issues[0]?.message ?? 'Invalid request payload' });
    }
    const { messages, message, model, conversation_id } = parsed.data;
    const authUser = (request as any).user as { userId?: string } | undefined;

    let msgArray: Message[] = messages && messages.length > 0
      ? (messages as Message[])
      : message
        ? [{ role: 'user', content: message }]
        : [];

    if (conversation_id) {
      if (!authUser?.userId) {
        return reply.code(401).send({ error: 'Authorization required for conversation memory' });
      }

      const convOwner = await pg.query<{ id: string }>(
        `SELECT id FROM conversations WHERE id = $1 AND user_id = $2 LIMIT 1`,
        [conversation_id, authUser.userId],
      );
      if (convOwner.rowCount === 0) {
        return reply.code(404).send({ error: 'Conversation not found' });
      }

      if (message && (!messages || messages.length === 0)) {
        const historyQuery = await pg.query<{ role: 'user' | 'assistant' | 'system'; content: string }>(
          `SELECT role, COALESCE(payload->'parts'->0->>'text', payload->>'content', content) AS content
           FROM messages
           WHERE conversation_id = $1
           ORDER BY created_at DESC
           LIMIT $2`,
          [conversation_id, conversationPageSize],
        );
        const history = [...historyQuery.rows].reverse();
        msgArray = [...history, { role: 'user', content: message }];
      }
    }

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

        if (conversation_id && authUser?.userId) {
          if (message && message.trim().length > 0) {
            await pg.query(
              `INSERT INTO messages (conversation_id, role, content, payload, model, token_count, latency_ms, metadata)
               VALUES ($1, 'user', $2, $3::jsonb, $4, 0, 0, $5::jsonb)`,
              [
                conversation_id,
                message,
                JSON.stringify({ parts: [{ type: 'text', text: message }] }),
                model ?? null,
                JSON.stringify({ source: 'gateway/chat' }),
              ],
            );
          }
          await pg.query(
            `INSERT INTO messages (conversation_id, role, content, payload, model, token_count, latency_ms, metadata)
             VALUES ($1, 'assistant', $2, $3::jsonb, $4, $5, $6, $7::jsonb)`,
            [
              conversation_id,
              text,
              JSON.stringify({ parts: [{ type: 'text', text }] }),
              result.model ?? model ?? null,
              result.usage?.total_tokens ?? 0,
              0,
              JSON.stringify({
                provider: result.provider,
                model: result.model ?? model ?? null,
                usage: result.usage ?? null,
              }),
            ],
          );
          await pg.query(
            `UPDATE conversations SET updated_at = NOW(), model = COALESCE($2, model) WHERE id = $1`,
            [conversation_id, result.model ?? model ?? null],
          );
        }

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
  fastify.post<{ Body: VisionBody }>('/vision', {
    preHandler: [verifyGatewayAccess, rateLimiter.middleware(30, 'gateway:vision')],
  }, async (request, reply) => {
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
  fastify.post<{ Body: ImageBody }>('/image', {
    preHandler: [verifyGatewayAccess, rateLimiter.middleware(20, 'gateway:image')],
  }, async (request, reply) => {
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
  fastify.post<{ Body: TTSBody }>('/tts', {
    preHandler: [verifyGatewayAccess, rateLimiter.middleware(30, 'gateway:tts')],
  }, async (request, reply) => {
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
  fastify.get('/stream', {
    websocket: true,
    preValidation: [verifyGatewayAccess, rateLimiter.middleware(60, 'gateway:stream')],
  }, (socket, request) => {
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

        if (msgArray.some((m) => String(m.content ?? '').length > MAX_MESSAGE_CHARS)) {
          socket.send(JSON.stringify({ type: 'chat/error', sessionId: sid, error: 'Message exceeds max size' }));
          return;
        }

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
