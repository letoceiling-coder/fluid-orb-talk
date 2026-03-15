import type { FastifyRequest, FastifyReply } from 'fastify';
import { ApiKeyManager } from './ApiKeyManager.js';

/**
 * ApiKeyMiddleware — Validates X-API-Key header and attaches workspace to request.
 *
 * Usage:
 *   fastify.addHook('preHandler', verifyApiKey);
 */
export async function verifyApiKey(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  const rawKey = request.headers['x-api-key'] as string | undefined;

  if (!rawKey) {
    reply.code(401).send({ error: 'Unauthorized', message: 'X-API-Key header is required' });
    return;
  }

  const manager = ApiKeyManager.getInstance();
  const workspace = await manager.validateKey(rawKey);

  if (!workspace) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or revoked API key' });
    return;
  }

  // Attach workspace info to request for downstream handlers
  (request as any).workspaceId = workspace.workspaceId;
  (request as any).userId = workspace.userId;
}
