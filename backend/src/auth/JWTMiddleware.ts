import type { FastifyRequest, FastifyReply } from 'fastify';

export interface JWTPayload {
  userId: string;
  workspaceId?: string;
  role: 'admin' | 'user' | 'viewer';
  email?: string;
  type?: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

/**
 * JWTMiddleware — Verifies Bearer token and attaches user to request.
 *
 * Usage in route:
 *   fastify.addHook('preHandler', verifyJWT);
 */
export async function verifyJWT(
  request: FastifyRequest,
  reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify<JWTPayload>();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
  }
}

/**
 * Optional JWT — does not reject if no token is present.
 * Useful for endpoints that work both authenticated and anonymous.
 */
export async function optionalJWT(
  request: FastifyRequest,
  _reply: FastifyReply,
): Promise<void> {
  try {
    await request.jwtVerify<JWTPayload>();
  } catch {
    // Allow unauthenticated access
  }
}
