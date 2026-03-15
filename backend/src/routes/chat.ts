import type { FastifyInstance } from 'fastify';
import { GatewayCore } from '../gateway/GatewayCore.js';
import { WSHub } from '../websocket/WSHub.js';
import { StreamHandler } from '../websocket/StreamHandler.js';
import { RateLimiter } from '../auth/RateLimiter.js';
import { verifyJWT } from '../auth/JWTMiddleware.js';
import type { Message } from '../types/provider.types.js';
import { v4 as uuidv4 } from 'uuid';

interface ChatBody {
  messages: Message[];
  model?: string;
  stream?: boolean;
  workspaceId?: string;
  strategy?: string;
}

export async function chatRoutes(fastify: FastifyInstance): Promise<void> {
  const gateway = GatewayCore.getInstance();
  const rateLimiter = RateLimiter.getInstance();

  // POST /api/v1/chat — standard chat completion
  fastify.post<{ Body: ChatBody }>('/', {
    preHandler: [verifyJWT, rateLimiter.middleware(60)],
  }, async (request, reply) => {
    const { messages, model, strategy, workspaceId } = request.body;
    const user = (request as any).user;

    const result = await gateway.handle({
      taskType: 'text/chat',
      payload: { messages, config: { model } },
      strategy,
      workspaceId: workspaceId ?? user?.workspaceId,
      userId: user?.userId,
    });

    return reply.send(result);
  });

  // GET /api/v1/chat/stream — WebSocket streaming endpoint
  fastify.get('/stream', { websocket: true }, (socket, request) => {
    const hub = WSHub.getInstance();
    const clientId = hub.addClient(socket);
    const handler = new StreamHandler(socket);

    socket.on('message', async (raw: Buffer) => {
      try {
        const msg = JSON.parse(raw.toString());

        if (msg.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong' }));
          return;
        }

        if (msg.type === 'chat') {
          const sessionId = msg.sessionId ?? uuidv4();
          hub.joinRoom(clientId, `session-${sessionId}`);

          await handler.streamChat(
            {
              taskType: 'text/chat',
              payload: { messages: msg.messages ?? [], config: { model: msg.model } },
              workspaceId: msg.workspaceId,
              userId: msg.userId,
            },
            sessionId,
          );
        }
      } catch (err) {
        socket.send(JSON.stringify({ type: 'chat/error', error: 'Invalid message format' }));
      }
    });
  });
}
