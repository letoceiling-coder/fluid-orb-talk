import type { FastifyInstance } from 'fastify';
import { WorkflowEngine } from '../workflows/WorkflowEngine.js';
import { WorkflowStore } from '../workflows/WorkflowStore.js';
import { verifyJWT } from '../auth/JWTMiddleware.js';
import type { WorkflowGraph } from '../types/workflow.types.js';

interface CreateWorkflowBody {
  name: string;
  graph: WorkflowGraph;
}

interface RunWorkflowBody {
  payload?: Record<string, unknown>;
}

export async function workflowsRoutes(fastify: FastifyInstance): Promise<void> {
  const engine = WorkflowEngine.getInstance();
  const store = WorkflowStore.getInstance();

  // GET /api/v1/workflows
  fastify.get('/', { preHandler: [verifyJWT] }, async (request, reply) => {
    const user = (request as any).user;
    const workflows = await store.list(user.workspaceId);
    return reply.send({ workflows });
  });

  // POST /api/v1/workflows — save workflow graph
  fastify.post<{ Body: CreateWorkflowBody }>('/', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    const user = (request as any).user;
    const { name, graph } = request.body;

    try {
      const id = await engine.create(user.workspaceId, name, graph);
      return reply.code(201).send({ id, name, nodeCount: graph.nodes.length });
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : 'Invalid workflow' });
    }
  });

  // GET /api/v1/workflows/:id
  fastify.get<{ Params: { id: string } }>('/:id', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    const graph = await store.load(request.params.id);
    if (!graph) return reply.code(404).send({ error: 'Workflow not found' });
    return reply.send({ id: request.params.id, graph });
  });

  // DELETE /api/v1/workflows/:id
  fastify.delete<{ Params: { id: string } }>('/:id', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    await store.delete(request.params.id);
    return reply.send({ deleted: true });
  });

  // POST /api/v1/workflows/:id/run — execute a workflow
  fastify.post<{ Params: { id: string }; Body: RunWorkflowBody }>('/:id/run', {
    preHandler: [verifyJWT],
  }, async (request, reply) => {
    const user = (request as any).user;
    const { payload = {} } = request.body;

    try {
      const results = await engine.execute(request.params.id, payload, {
        workspaceId: user.workspaceId,
        userId: user.userId,
      });
      return reply.send({ success: true, results });
    } catch (err) {
      return reply.code(400).send({ error: err instanceof Error ? err.message : 'Execution failed' });
    }
  });
}
