import type { FastifyInstance } from 'fastify';
import { GatewayCore } from '../gateway/GatewayCore.js';
import { verifyJWT } from '../auth/JWTMiddleware.js';
import { RateLimiter } from '../auth/RateLimiter.js';

interface VisionBody {
  imageBase64: string;
  prompt?: string;
  provider?: string;
}

export async function visionRoutes(fastify: FastifyInstance): Promise<void> {
  const gateway = GatewayCore.getInstance();
  const rateLimiter = RateLimiter.getInstance();

  // POST /api/v1/vision/analyze — analyze image + text prompt
  fastify.post<{ Body: VisionBody }>('/analyze', {
    preHandler: [verifyJWT, rateLimiter.middleware(30)],
  }, async (request, reply) => {
    const { imageBase64, prompt, provider } = request.body;
    const user = (request as any).user;

    if (!imageBase64) {
      return reply.code(400).send({ error: 'imageBase64 is required' });
    }

    const result = await gateway.handle({
      taskType: 'vision/analyze',
      payload: { frame: imageBase64, prompt },
      workspaceId: user?.workspaceId,
      userId: user?.userId,
    });

    return reply.send(result);
  });

  // GET /api/v1/vision/stream — WebSocket for real-time camera analysis
  fastify.get('/stream', { websocket: true }, (socket) => {
    socket.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'frame') {
          const result = await gateway.handle({
            taskType: 'vision/analyze',
            payload: { frame: msg.imageBase64, prompt: msg.prompt },
            workspaceId: msg.workspaceId,
            userId: msg.userId,
          });

          socket.send(JSON.stringify({ type: 'vision/result', result }));
        }
      } catch {
        socket.send(JSON.stringify({ type: 'vision/error', error: 'Analysis failed' }));
      }
    });
  });
}
