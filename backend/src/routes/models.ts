import type { FastifyInstance } from 'fastify';
import { ProviderRegistry } from '../providers/ProviderRegistry.js';

export async function modelsRoutes(fastify: FastifyInstance): Promise<void> {
  const registry = ProviderRegistry.getInstance();

  // GET /api/v1/models — list all registered providers and their task types
  fastify.get('/', async (_request, reply) => {
    const providers = registry.listAll();
    return reply.send({ providers });
  });

  // GET /api/v1/models/:provider — get info for a specific provider
  fastify.get<{ Params: { provider: string } }>('/:provider', async (request, reply) => {
    try {
      const provider = registry.getProvider(request.params.provider);
      const available = await provider.isAvailable();
      return reply.send({
        name: provider.name,
        tasks: provider.supportedTaskTypes,
        available,
        qualityRank: provider.qualityRank,
        region: provider.region,
      });
    } catch {
      return reply.code(404).send({ error: `Provider "${request.params.provider}" not found` });
    }
  });

  // GET /api/v1/models/task/:taskType — list providers for a specific task
  fastify.get<{ Params: { taskType: string } }>('/task/:taskType', async (request, reply) => {
    const candidates = registry.getProvidersForTask(request.params.taskType as any);
    return reply.send({
      taskType: request.params.taskType,
      providers: candidates.map((p) => ({
        name: p.name,
        latency: p.getLatencyEstimate(),
        qualityRank: p.qualityRank,
      })),
    });
  });
}
