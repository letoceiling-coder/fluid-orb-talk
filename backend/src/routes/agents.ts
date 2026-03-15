import type { FastifyInstance } from 'fastify';
import { AgentSystem } from '../agents/AgentSystem.js';
import { verifyJWT } from '../auth/JWTMiddleware.js';

interface CreateAgentBody {
  type: 'video-creator' | 'image-creator' | 'research' | 'marketing';
  name?: string;
  config?: Record<string, unknown>;
}

interface StartAgentBody {
  task: string;
}

export async function agentsRoutes(fastify: FastifyInstance): Promise<void> {
  const system = AgentSystem.getInstance();

  // GET /api/v1/agents — list all agents
  fastify.get('/', { preHandler: [verifyJWT] }, async (_request, reply) => {
    return reply.send({ agents: system.listAgents() });
  });

  // POST /api/v1/agents — create new agent
  fastify.post<{ Body: CreateAgentBody }>('/', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    const { type, name, config } = request.body;
    const id = system.createAgent({ type, name: name ?? type, ...(config ?? {}) });
    return reply.code(201).send({ id, type, status: 'idle' });
  });

  // GET /api/v1/agents/:id — get agent status
  fastify.get<{ Params: { id: string } }>('/:id', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    try {
      const state = system.getStatus(request.params.id);
      return reply.send({ id: request.params.id, state });
    } catch {
      return reply.code(404).send({ error: 'Agent not found' });
    }
  });

  // POST /api/v1/agents/:id/start — start agent with a task
  fastify.post<{ Params: { id: string }; Body: StartAgentBody }>('/:id/start', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    const { task } = request.body;
    // Fire-and-forget so HTTP responds immediately
    system.startAgent(request.params.id, task).catch(console.error);
    return reply.send({ id: request.params.id, status: 'starting', task });
  });

  // POST /api/v1/agents/:id/pause
  fastify.post<{ Params: { id: string } }>('/:id/pause', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    system.pauseAgent(request.params.id);
    return reply.send({ id: request.params.id, status: 'paused' });
  });

  // POST /api/v1/agents/:id/resume
  fastify.post<{ Params: { id: string } }>('/:id/resume', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    system.resumeAgent(request.params.id);
    return reply.send({ id: request.params.id, status: 'running' });
  });

  // DELETE /api/v1/agents/:id
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    system.deleteAgent(request.params.id);
    return reply.send({ deleted: true });
  });
}
