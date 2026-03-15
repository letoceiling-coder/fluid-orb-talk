/**
 * Public Gateway Routes — mounted at root (no JWT required for Phase 1)
 * Frontend calls /gateway/chat and /gateway/vision
 * Nginx strips /gateway/ prefix → backend receives /chat and /vision
 */
import type { FastifyInstance } from 'fastify';
import { GatewayCore } from '../gateway/GatewayCore.js';
import type { Message } from '../types/provider.types.js';

interface ChatBody {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  model?: string;
  stream?: boolean;
}

interface VisionBody {
  imageBase64: string;
  prompt?: string;
}

export async function gatewayRoutes(fastify: FastifyInstance): Promise<void> {
  const gateway = GatewayCore.getInstance();

  // POST /chat — public chat completion
  fastify.post<{ Body: ChatBody }>('/chat', async (request, reply) => {
    const { messages, model } = request.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return reply.code(400).send({ error: 'messages array is required' });
    }

    try {
      const result = await gateway.handle({
        taskType: 'text/chat',
        payload: { messages: messages as Message[], model },
      });

      if (result.success) {
        const dataVal = result.data as Record<string, unknown> | undefined;
        const raw = dataVal?.response ?? dataVal;
        const message = typeof raw === 'string'
          ? raw
          : JSON.stringify(raw ?? '');
        return reply.send({
          message,
          model: model ?? 'default',
          usage: null,
        });
      }

      return reply.code(502).send({ error: result.error ?? 'Gateway error' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Internal error';
      fastify.log.error({ err }, 'Gateway chat error');
      return reply.code(500).send({ error: msg });
    }
  });

  // POST /vision — public vision analysis
  fastify.post<{ Body: VisionBody }>('/vision', async (request, reply) => {
    const { imageBase64, prompt = 'Describe what you see in this image in detail.' } = request.body;

    if (!imageBase64) {
      return reply.code(400).send({ error: 'imageBase64 is required' });
    }

    try {
      const result = await gateway.handle({
        taskType: 'vision/analyze',
        payload: { frame: imageBase64, prompt },
      });

      if (result.success) {
        const data = result.data as Record<string, unknown> | undefined;
        const raw = data?.response as Record<string, unknown> | string | undefined;
        const description = typeof raw === 'string'
          ? raw
          : typeof raw === 'object' && raw
            ? String(raw.description ?? raw.text ?? JSON.stringify(raw))
            : 'Analysis complete';
        return reply.send({
          description,
          objects: (data?.objects ?? []) as string[],
          confidence: data?.confidence ?? null,
        });
      }

      return reply.code(502).send({ error: result.error ?? 'Vision error' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Internal error';
      fastify.log.error({ err }, 'Gateway vision error');
      return reply.code(500).send({ error: msg });
    }
  });
}
