import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';

import { chatRoutes } from './routes/chat.js';
import { visionRoutes } from './routes/vision.js';
import { mediaRoutes } from './routes/media.js';
import { modelsRoutes } from './routes/models.js';
import { agentsRoutes } from './routes/agents.js';
import { workflowsRoutes } from './routes/workflows.js';
import { authRoutes } from './routes/auth.js';
import { keysRoutes } from './routes/keys.js';
import { usageRoutes } from './routes/usage.js';
import { gatewayRoutes } from './routes/gateway.js';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.NODE_ENV === 'production' ? 'warn' : 'info',
    },
  });

  // ── Plugins ──────────────────────────────────────────────────────────────
  await app.register(cors, {
    origin: process.env.CORS_ORIGIN ?? '*',
    credentials: true,
  });

  await app.register(jwt, {
    secret: process.env.JWT_SECRET ?? 'fallback-secret-change-in-production',
  });

  await app.register(websocket);

  // ── Health check ─────────────────────────────────────────────────────────
  app.get('/health', async () => ({
    status: 'ok',
    service: 'ai-gateway',
    timestamp: new Date().toISOString(),
    version: '0.1.0',
  }));

  // ── Public Gateway Routes (Phase 1 — no auth) ────────────────────────────
  await app.register(gatewayRoutes,   { prefix: '' });

  // ── API Routes ───────────────────────────────────────────────────────────
  await app.register(authRoutes,      { prefix: '/api/v1/auth' });
  await app.register(keysRoutes,      { prefix: '/api/v1/keys' });
  await app.register(chatRoutes,      { prefix: '/api/v1/chat' });
  await app.register(visionRoutes,    { prefix: '/api/v1/vision' });
  await app.register(mediaRoutes,     { prefix: '/api/v1/media' });
  await app.register(modelsRoutes,    { prefix: '/api/v1/models' });
  await app.register(agentsRoutes,    { prefix: '/api/v1/agents' });
  await app.register(workflowsRoutes, { prefix: '/api/v1/workflows' });
  await app.register(usageRoutes,     { prefix: '/api/v1/usage' });

  return app;
}
