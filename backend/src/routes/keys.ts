import type { FastifyInstance } from 'fastify';
import { ApiKeyManager } from '../auth/ApiKeyManager.js';
import { verifyJWT } from '../auth/JWTMiddleware.js';

interface CreateKeyBody {
  name: string;
  rateLimit?: number;
}

export async function keysRoutes(fastify: FastifyInstance): Promise<void> {
  const manager = ApiKeyManager.getInstance();

  // GET /api/v1/keys — list API keys for workspace
  fastify.get('/', { preHandler: [verifyJWT] }, async (request, reply) => {
    const user = (request as any).user;
    const keys = await manager.listKeys(user.workspaceId);
    return reply.send({ keys });
  });

  // POST /api/v1/keys — create new API key
  fastify.post<{ Body: CreateKeyBody }>('/', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    const user = (request as any).user;
    const { name, rateLimit = 60 } = request.body;

    const rawKey = await manager.generateKey(user.workspaceId, name, rateLimit);

    return reply.code(201).send({
      key: rawKey,
      warning: 'This key is shown only once. Store it securely.',
    });
  });

  // DELETE /api/v1/keys/:id — revoke API key
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    await manager.revokeKey(request.params.id);
    return reply.send({ revoked: true, id: request.params.id });
  });
}
