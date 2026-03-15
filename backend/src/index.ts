import 'dotenv/config';
import { buildApp } from './app.js';
import { WSHub } from './websocket/WSHub.js';
import { PostgresClient } from './db/PostgresClient.js';
import { RedisRateLimiter } from './security/RedisRateLimiter.js';

const PORT = Number(process.env.PORT) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

async function main(): Promise<void> {
  const app = await buildApp();

  // Initialize required infrastructure connections
  await PostgresClient.getInstance().connect();
  await RedisRateLimiter.getInstance().connect();

  // Initialize WebSocket hub
  WSHub.getInstance().init(app.server);

  try {
    await app.listen({ port: PORT, host: HOST });
    console.log(`[AI Gateway] Server running on http://${HOST}:${PORT}`);
    console.log(`[AI Gateway] Environment: ${process.env.NODE_ENV ?? 'development'}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

main();
