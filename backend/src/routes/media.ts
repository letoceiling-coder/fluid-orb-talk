import type { FastifyInstance } from 'fastify';
import { ImagePipeline } from '../media/ImagePipeline.js';
import { VideoPipeline } from '../media/VideoPipeline.js';
import { AudioPipeline } from '../media/AudioPipeline.js';
import { verifyJWT } from '../auth/JWTMiddleware.js';
import { RateLimiter } from '../auth/RateLimiter.js';

export async function mediaRoutes(fastify: FastifyInstance): Promise<void> {
  const imagePipeline = ImagePipeline.getInstance();
  const videoPipeline = VideoPipeline.getInstance();
  const audioPipeline = AudioPipeline.getInstance();
  const rateLimiter = RateLimiter.getInstance();

  // POST /api/v1/media/image — generate image
  fastify.post<{ Body: { prompt: string; model?: string; width?: number; height?: number } }>(
    '/image',
    { preHandler: [verifyJWT, rateLimiter.middleware(20)] },
    async (request, reply) => {
      const { prompt, width, height } = request.body;
      const result = await imagePipeline.generate({ prompt, width, height });
      return reply.send({ success: true, data: result });
    },
  );

  // POST /api/v1/media/video — generate video
  fastify.post<{ Body: { prompt: string; model?: string; durationSeconds?: number } }>(
    '/video',
    { preHandler: [verifyJWT, rateLimiter.middleware(5)] },
    async (request, reply) => {
      const { prompt, durationSeconds } = request.body;
      const result = await videoPipeline.generate({ prompt, durationSeconds });
      return reply.send({ success: true, data: result });
    },
  );

  // POST /api/v1/media/tts — text to speech
  fastify.post<{ Body: { text: string; voice?: string; language?: string } }>(
    '/tts',
    { preHandler: [verifyJWT, rateLimiter.middleware(30)] },
    async (request, reply) => {
      const { text, voice, language } = request.body;
      const audioBuffer = await audioPipeline.tts(text, { voice, language });
      return reply
        .header('Content-Type', 'audio/mpeg')
        .send(audioBuffer);
    },
  );

  // POST /api/v1/media/stt — speech to text (binary body)
  fastify.post('/stt', {
    preHandler: [verifyJWT, rateLimiter.middleware(20)],
  }, async (_request, reply) => {
    // TODO: integrate @fastify/multipart and pipe to audioPipeline.stt()
    return reply.send({ success: true, transcript: '[STT placeholder — multipart not yet wired]' });
  });
}
