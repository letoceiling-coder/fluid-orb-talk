import type { FastifyInstance } from 'fastify';
import { PostgresClient } from '../db/PostgresClient.js';
import { verifyJWT } from '../auth/JWTMiddleware.js';
import { z } from 'zod';

interface CreateConversationBody {
  title?: string;
}

interface PostMessageBody {
  role?: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
}

const createConversationSchema = z.object({
  title: z.string().min(1).max(200).optional(),
});

const postMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']).optional(),
  content: z.string().min(1).max(20_000),
  metadata: z.record(z.unknown()).optional(),
});

export async function conversationsRoutes(fastify: FastifyInstance): Promise<void> {
  const db = PostgresClient.getInstance();

  fastify.post<{ Body: CreateConversationBody }>('/conversations', { preHandler: [verifyJWT] }, async (request, reply) => {
    const parsed = createConversationSchema.safeParse(request.body ?? {});
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid request payload' });
    }
    const user = (request as any).user as { userId?: string };
    if (!user?.userId) return reply.code(401).send({ error: 'Unauthorized' });

    const title = parsed.data.title?.trim() || 'New conversation';
    const result = await db.query<{ id: string; user_id: string; title: string; created_at: string; updated_at: string }>(
      `INSERT INTO conversations (user_id, title)
       VALUES ($1, $2)
       RETURNING id, user_id, title, created_at, updated_at`,
      [user.userId, title],
    );

    return reply.code(201).send(result.rows[0]);
  });

  fastify.get('/conversations', { preHandler: [verifyJWT] }, async (request, reply) => {
    const user = (request as any).user as { userId?: string };
    if (!user?.userId) return reply.code(401).send({ error: 'Unauthorized' });

    const result = await db.query<{
      id: string;
      user_id: string;
      title: string;
      created_at: string;
      updated_at: string;
    }>(
      `SELECT id, user_id, title, created_at, updated_at
       FROM conversations
       WHERE user_id = $1
       ORDER BY updated_at DESC`,
      [user.userId],
    );

    return reply.send({ conversations: result.rows });
  });

  fastify.get<{ Params: { id: string } }>('/conversations/:id/messages', { preHandler: [verifyJWT] }, async (request, reply) => {
    const user = (request as any).user as { userId?: string };
    if (!user?.userId) return reply.code(401).send({ error: 'Unauthorized' });

    const owner = await db.query<{ id: string }>(
      `SELECT id FROM conversations WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [request.params.id, user.userId],
    );
    if (owner.rowCount === 0) return reply.code(404).send({ error: 'Conversation not found' });

    const limitRaw = Number((request.query as Record<string, string | undefined>)?.limit ?? 50);
    const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 50;
    const cursor = (request.query as Record<string, string | undefined>)?.cursor;

    const messages = await db.query<{
      id: string;
      conversation_id: string;
      role: string;
      content: string;
      payload: Record<string, unknown> | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>(
      `SELECT id, conversation_id, role, content, payload, metadata, created_at
       FROM messages
       WHERE conversation_id = $1
         ${cursor ? 'AND created_at < $2::timestamptz' : ''}
       ORDER BY created_at DESC
       LIMIT ${limit}`,
      cursor ? [request.params.id, cursor] : [request.params.id],
    );
    const ordered = [...messages.rows].reverse();
    const nextCursor = messages.rows.length === limit ? messages.rows[messages.rows.length - 1].created_at : null;
    return reply.send({ messages: ordered, next_cursor: nextCursor });
  });

  fastify.post<{ Params: { id: string }; Body: PostMessageBody }>('/conversations/:id/messages', { preHandler: [verifyJWT] }, async (request, reply) => {
    const parsed = postMessageSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: 'Invalid request payload' });
    }
    const user = (request as any).user as { userId?: string };
    if (!user?.userId) return reply.code(401).send({ error: 'Unauthorized' });

    const owner = await db.query<{ id: string }>(
      `SELECT id FROM conversations WHERE id = $1 AND user_id = $2 LIMIT 1`,
      [request.params.id, user.userId],
    );
    if (owner.rowCount === 0) return reply.code(404).send({ error: 'Conversation not found' });

    const role = parsed.data.role ?? 'user';
    const content = parsed.data.content.trim();

    const saved = await db.query<{
      id: string;
      conversation_id: string;
      role: string;
      content: string;
      payload: Record<string, unknown> | null;
      metadata: Record<string, unknown> | null;
      created_at: string;
    }>(
      `INSERT INTO messages (conversation_id, role, content, payload, model, token_count, latency_ms, metadata)
       VALUES ($1, $2, $3, $4::jsonb, NULL, 0, 0, $5::jsonb)
       RETURNING id, conversation_id, role, content, payload, metadata, created_at`,
      [
        request.params.id,
        role,
        content,
        JSON.stringify({ parts: [{ type: 'text', text: content }] }),
        parsed.data.metadata ? JSON.stringify(parsed.data.metadata) : null,
      ],
    );

    await db.query(
      `UPDATE conversations SET updated_at = NOW() WHERE id = $1`,
      [request.params.id],
    );

    return reply.code(201).send(saved.rows[0]);
  });

  fastify.delete<{ Params: { id: string } }>('/conversations/:id', { preHandler: [verifyJWT] }, async (request, reply) => {
    const user = (request as any).user as { userId?: string };
    if (!user?.userId) return reply.code(401).send({ error: 'Unauthorized' });

    const result = await db.query(
      `DELETE FROM conversations WHERE id = $1 AND user_id = $2`,
      [request.params.id, user.userId],
    );

    if (result.rowCount === 0) return reply.code(404).send({ error: 'Conversation not found' });
    return reply.send({ success: true });
  });
}

