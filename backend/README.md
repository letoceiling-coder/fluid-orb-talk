# AI Gateway Platform — Backend

Node.js + TypeScript + Fastify backend skeleton for the AI Gateway Platform.

---

## Architecture

```
src/
├── index.ts              Entry point — loads env, starts server
├── app.ts                Fastify instance + plugins + routes
│
├── gateway/
│   ├── GatewayCore.ts    Central orchestrator — validate → route → execute
│   ├── SuperRouter.ts    Provider selection (6 routing strategies)
│   └── ExecutionEngine.ts Task executor (chat, vision, image, video, audio)
│
├── providers/
│   ├── BaseProvider.ts         Abstract provider interface
│   ├── OpenAIProvider.ts       GPT-4o, Whisper, TTS
│   ├── AnthropicProvider.ts    Claude 4 Sonnet / Haiku
│   ├── GoogleProvider.ts       Gemini 2.5 Pro / Flash
│   ├── ElevenLabsProvider.ts   Text-to-Speech (voice cloning)
│   ├── ReplicateProvider.ts    Image & Video generation
│   └── ProviderRegistry.ts     Runtime registry + task routing
│
├── media/
│   ├── ImagePipeline.ts    text→image, img2img, upscale
│   ├── VideoPipeline.ts    text→video, image→video, lipsync
│   └── AudioPipeline.ts    TTS, STT, music generation
│
├── agents/
│   ├── AgentSystem.ts          Lifecycle manager for all agents
│   ├── AgentRunner.ts          Single-agent execution wrapper
│   └── agents/
│       ├── BaseAgent.ts        Abstract agent (plan/step/observe loop)
│       ├── VideoCreatorAgent.ts
│       ├── ImageCreatorAgent.ts
│       ├── ResearchAgent.ts
│       └── MarketingAgent.ts
│
├── workflows/
│   ├── WorkflowEngine.ts   Create + execute ReactFlow graphs
│   ├── WorkflowStore.ts    DB persistence for workflow graphs
│   └── nodes/
│       ├── BaseNode.ts
│       ├── TriggerNode.ts
│       ├── PromptNode.ts
│       ├── AIModelNode.ts
│       ├── ImageGeneratorNode.ts
│       ├── VideoGeneratorNode.ts
│       ├── VoiceGeneratorNode.ts
│       ├── APICallNode.ts
│       └── StorageNode.ts
│
├── auth/
│   ├── JWTMiddleware.ts    Bearer token verification (Fastify hook)
│   ├── ApiKeyMiddleware.ts X-API-Key verification
│   ├── ApiKeyManager.ts    Key generation / validation / revocation
│   └── RateLimiter.ts      In-memory token bucket (Redis-ready)
│
├── websocket/
│   ├── WSHub.ts            Connection manager + room broadcasting
│   ├── StreamHandler.ts    Pipes AI streaming to a specific socket
│   └── events.ts           TypeScript event type definitions
│
├── routes/
│   ├── auth.ts       POST /register, POST /login, GET /me
│   ├── chat.ts       POST /chat, GET /chat/stream (WS)
│   ├── vision.ts     POST /vision/analyze, GET /vision/stream (WS)
│   ├── media.ts      POST /image, /video, /tts, /stt
│   ├── models.ts     GET /models, /:provider, /task/:type
│   ├── agents.ts     CRUD + start/pause/resume/stop
│   ├── workflows.ts  CRUD + POST /:id/run
│   ├── keys.ts       GET/POST/DELETE API keys
│   └── usage.ts      GET /usage, GET /usage/summary
│
├── db/
│   ├── DatabaseClient.ts   MySQL connection pool (mysql2)
│   └── schema.sql          Full schema (7 tables)
│
├── types/
│   ├── gateway.types.ts
│   ├── provider.types.ts
│   ├── agent.types.ts
│   └── workflow.types.ts
│
└── utils/
    └── UsageLogger.ts      Non-blocking usage metrics logger
```

---

## Modules

| Module | Responsibility |
|--------|---------------|
| GatewayCore | Validates, routes, executes, and logs every AI request |
| SuperRouter | Selects provider using 6 configurable strategies |
| ExecutionEngine | Calls provider methods per task type |
| ProviderRegistry | Runtime registry with availability check |
| Providers (×5) | Adapter stubs for OpenAI, Anthropic, Google, ElevenLabs, Replicate |
| ImagePipeline | text→image, img2img, upscaling |
| VideoPipeline | text→video, image→video, lipsync |
| AudioPipeline | TTS, STT, music generation |
| AgentSystem | Full agent lifecycle (create/start/pause/stop/delete) |
| WorkflowEngine | Topological execution of ReactFlow node graphs |
| WorkflowStore | MySQL-backed workflow persistence |
| JWTMiddleware | Bearer token auth hook for Fastify |
| ApiKeyManager | SHA-256 key hashing, generation, revocation |
| RateLimiter | 1-minute sliding window, per-key rate limiting |
| WSHub | WebSocket connection pool + room-based broadcasting |
| StreamHandler | Bridges AI streaming responses to WebSocket clients |
| DatabaseClient | mysql2 connection pool singleton with transactions |
| UsageLogger | Fire-and-forget usage metrics to MySQL |

---

## Running Locally

### 1. Install dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your DB credentials and API keys
```

### 3. Create database

```bash
mysql -u root -p < src/db/schema.sql
```

### 4. Start dev server

```bash
npm run dev
```

Server starts at `http://localhost:5000`

Health check: `GET http://localhost:5000/health`

---

## Build for Production

```bash
npm run build      # Compiles TypeScript to dist/
npm start          # Runs dist/index.js
```

---

## Deployment (VPS)

See `SERVER_AUDIT.md` in the project root for the full VPS deployment plan.

Quick summary:
- Deploy to `/var/www/ai-gateway/`
- Run with PM2: `pm2 start dist/index.js --name ai-gateway`
- Nginx proxy: `location /gateway/ → http://127.0.0.1:5000`

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | /api/v1/auth/register | — | Create account |
| POST | /api/v1/auth/login | — | Login, get JWT |
| GET | /api/v1/auth/me | JWT | Current user info |
| POST | /api/v1/chat | JWT | Chat completion |
| WS | /api/v1/chat/stream | — | Streaming chat |
| POST | /api/v1/vision/analyze | JWT | Vision analysis |
| WS | /api/v1/vision/stream | — | Real-time camera |
| POST | /api/v1/media/image | JWT | Image generation |
| POST | /api/v1/media/video | JWT | Video generation |
| POST | /api/v1/media/tts | JWT | Text to speech |
| GET | /api/v1/models | — | List providers |
| GET/POST/DELETE | /api/v1/agents | JWT | Agent management |
| GET/POST/DELETE | /api/v1/workflows | JWT | Workflow CRUD |
| POST | /api/v1/workflows/:id/run | JWT | Execute workflow |
| GET/POST/DELETE | /api/v1/keys | JWT | API key management |
| GET | /api/v1/usage | JWT | Usage logs |
| GET | /api/v1/usage/summary | JWT | Aggregated stats |
