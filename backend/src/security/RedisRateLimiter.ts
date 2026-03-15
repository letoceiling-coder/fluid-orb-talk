import type { FastifyReply, FastifyRequest } from 'fastify';
import { createClient, type RedisClientType } from 'redis';

export class RedisRateLimiter {
  private static instance: RedisRateLimiter;
  private client: RedisClientType | null = null;
  private connected = false;

  private constructor() {}

  static getInstance(): RedisRateLimiter {
    if (!RedisRateLimiter.instance) {
      RedisRateLimiter.instance = new RedisRateLimiter();
    }
    return RedisRateLimiter.instance;
  }

  async connect(): Promise<void> {
    if (this.connected) return;
    const url = process.env.REDIS_URL;
    if (!url) {
      throw new Error('REDIS_URL must be set for distributed rate limiting');
    }
    this.client = createClient({ url });
    this.client.on('error', (err) => {
      console.error('[RedisRateLimiter] Redis error:', err);
    });
    await this.client.connect();
    this.connected = true;
  }

  middleware(limitPerMinute: number, bucket: string) {
    return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
      await this.connect();
      if (!this.client) {
        reply.code(503).send({ error: 'Rate limiter unavailable' });
        return;
      }

      const actor =
        ((request as any).user?.userId as string | undefined) ??
        ((request as any).workspaceId as string | undefined) ??
        (request.headers['x-api-key'] as string | undefined) ??
        request.ip ??
        'anonymous';

      const window = Math.floor(Date.now() / 60_000);
      const key = `rl:${bucket}:${actor}:${window}`;
      const value = await this.client.incr(key);
      if (value === 1) {
        await this.client.expire(key, 61);
      }

      const remaining = Math.max(0, limitPerMinute - value);
      reply.header('X-RateLimit-Limit', limitPerMinute);
      reply.header('X-RateLimit-Remaining', remaining);
      reply.header('X-RateLimit-Reset', (window + 1) * 60);

      if (value > limitPerMinute) {
        reply.code(429).send({
          error: 'Too Many Requests',
          message: 'Rate limit exceeded',
        });
      }
    };
  }
}

