import type { FastifyInstance } from 'fastify';
import { PostgresClient } from '../db/PostgresClient.js';
import { verifyJWT } from '../auth/JWTMiddleware.js';

export async function usageRoutes(fastify: FastifyInstance): Promise<void> {
  const db = PostgresClient.getInstance();

  // GET /api/v1/usage — usage logs for the current workspace
  fastify.get('/', { preHandler: [verifyJWT] }, async (request, reply) => {
    const user = (request as any).user;
    const { provider, taskType, from, to, limit = 100 } = request.query as any;

    let sql = `
      SELECT id, provider, task_type, status, latency_ms, created_at
      FROM usage_logs
      WHERE workspace_id = $1
    `;
    const params: unknown[] = [user.workspaceId];
    let idx = 2;

    if (provider) { sql += ` AND provider = $${idx++}`; params.push(provider); }
    if (taskType) { sql += ` AND task_type = $${idx++}`; params.push(taskType); }
    if (from)     { sql += ` AND created_at >= $${idx++}`; params.push(from); }
    if (to)       { sql += ` AND created_at <= $${idx++}`; params.push(to); }

    sql += ` ORDER BY created_at DESC LIMIT $${idx}`;
    params.push(Number(limit));

    const rows = await db.query<any>(sql, params);
    return reply.send({ logs: rows.rows });
  });

  // GET /api/v1/usage/summary — aggregated stats
  fastify.get('/summary', { preHandler: [verifyJWT] }, async (request, reply) => {
    const user = (request as any).user;

    const rows = await db.query<any>(
      `SELECT
         provider,
         task_type,
         COUNT(*) AS total_requests,
         SUM(CASE WHEN status = 'success' THEN 1 ELSE 0 END) AS successful,
         AVG(latency_ms) AS avg_latency_ms
       FROM usage_logs
       WHERE workspace_id = $1
       GROUP BY provider, task_type
       ORDER BY total_requests DESC`,
      [user.workspaceId],
    );

    return reply.send({ summary: rows.rows });
  });
}
