# Backend Folder Structure — AI Gateway Platform

Complete backend structure for transforming fluid-orb-talk into a production AI Gateway Platform.

---

## Directory Tree

```
backend/
├── src/
│   ├── index.ts                        ← HTTP server entry point
│   ├── app.ts                          ← Express/Fastify app setup, middleware registration
│   │
│   ├── gateway/
│   │   ├── GatewayCore.ts              ← Central request orchestrator
│   │   ├── SuperRouter.ts              ← Routes by task type + strategy
│   │   ├── ToolRouter.ts               ← Tool/function selection for agents
│   │   └── ExecutionEngine.ts          ← Executes resolved task against provider
│   │
│   ├── providers/
│   │   ├── BaseProvider.ts             ← Abstract interface all adapters implement
│   │   ├── ProviderRegistry.ts         ← Runtime registry of available providers
│   │   ├── OpenAIProvider.ts           ← text, vision, TTS, STT, embeddings
│   │   ├── AnthropicProvider.ts        ← text, vision (Claude)
│   │   ├── GoogleProvider.ts           ← text, vision (Gemini)
│   │   ├── ElevenLabsProvider.ts       ← TTS streaming
│   │   ├── ReplicateProvider.ts        ← image generation, video generation
│   │   └── VisionProvider.ts           ← Unified vision facade over OpenAI/Google/Anthropic
│   │
│   ├── agents/
│   │   ├── AgentSystem.ts              ← Agent lifecycle: create, start, stop, status
│   │   ├── AgentRunner.ts              ← Runs a single agent step loop
│   │   └── agents/
│   │       ├── BaseAgent.ts            ← Abstract agent class
│   │       ├── VideoCreatorAgent.ts    ← Vision + Video + Image capabilities
│   │       ├── ImageCreatorAgent.ts    ← Image + Vision + Code
│   │       ├── ResearchAgent.ts        ← Browsing + Analytics + Code
│   │       └── MarketingAgent.ts       ← Vision + Code + Browsing
│   │
│   ├── workflows/
│   │   ├── WorkflowEngine.ts           ← Create, run, pause, cancel workflows
│   │   ├── WorkflowStore.ts            ← Persist/load workflow graphs
│   │   └── nodes/
│   │       ├── BaseNode.ts             ← Abstract node executor
│   │       ├── TriggerNode.ts          ← User message, file upload, schedule, webhook
│   │       ├── PromptNode.ts           ← Format prompt from template
│   │       ├── AIModelNode.ts          ← Call SuperRouter
│   │       ├── ImageGeneratorNode.ts   ← Call ImagePipeline
│   │       ├── VideoGeneratorNode.ts   ← Call VideoPipeline
│   │       ├── VoiceGeneratorNode.ts   ← Call AudioPipeline
│   │       ├── APICallNode.ts          ← External HTTP request
│   │       └── StorageNode.ts          ← Save result to DB/file storage
│   │
│   ├── media/
│   │   ├── ImagePipeline.ts            ← text→image, image→image, inpaint, upscale
│   │   ├── VideoPipeline.ts            ← text→video, image→video, video edit
│   │   └── AudioPipeline.ts            ← text→speech, speech→text, music generation
│   │
│   ├── auth/
│   │   ├── JWTMiddleware.ts            ← Verify Bearer token, attach user to request
│   │   ├── ApiKeyMiddleware.ts         ← Validate X-API-Key header
│   │   ├── ApiKeyManager.ts            ← Generate, revoke, list API keys
│   │   └── RateLimiter.ts              ← Per-key rate limiting (requests/min)
│   │
│   ├── logging/
│   │   ├── UsageLogger.ts              ← Log every request: provider, tokens, cost, latency
│   │   └── AuditLogger.ts              ← Auth events, key creation/revocation
│   │
│   ├── websocket/
│   │   ├── WSHub.ts                    ← WebSocket server, connection management
│   │   ├── StreamHandler.ts            ← Pipe provider stream → WS client
│   │   └── events.ts                   ← Event type definitions for WS protocol
│   │
│   ├── routes/
│   │   ├── chat.ts                     ← POST /api/v1/chat
│   │   ├── vision.ts                   ← POST /api/v1/vision
│   │   ├── media.ts                    ← POST /api/v1/media/image|video|audio
│   │   ├── agents.ts                   ← GET/POST /api/v1/agents
│   │   ├── workflows.ts                ← GET/POST/PUT /api/v1/workflows
│   │   ├── models.ts                   ← GET /api/v1/models
│   │   ├── auth.ts                     ← POST /api/v1/auth/login|refresh
│   │   ├── keys.ts                     ← GET/POST/DELETE /api/v1/keys
│   │   └── usage.ts                    ← GET /api/v1/usage|logs|monitoring
│   │
│   ├── db/
│   │   ├── schema.sql                  ← All table definitions
│   │   ├── DatabaseClient.ts           ← Connection pool, query helper
│   │   └── migrations/
│   │       └── 001_initial.sql
│   │
│   └── types/
│       ├── provider.types.ts           ← ProviderRequest, ProviderResponse, StreamChunk
│       ├── gateway.types.ts            ← TaskType, RoutingStrategy, GatewayRequest
│       ├── agent.types.ts              ← AgentConfig, AgentState, AgentCapability
│       └── workflow.types.ts           ← WorkflowGraph, NodeType, ExecutionStatus
│
├── package.json
├── tsconfig.json
└── .env.example
```

---

## Module Descriptions

### `gateway/GatewayCore.ts`

Central orchestrator. All incoming requests pass through here.

**Responsibilities:**
- Validate request structure
- Apply auth middleware result (user, API key, rate limit)
- Delegate to SuperRouter for provider selection
- Delegate to ExecutionEngine for task execution
- Return unified response or initiate WebSocket stream

**Key method:**
```typescript
handle(req: GatewayRequest): Promise<GatewayResponse | void>
```

---

### `gateway/SuperRouter.ts`

Routes requests to the correct provider based on task type and configured strategy.

**Task types (mirror of `AIGatewayCore.tsx` categories):**
- `text/chat` → OpenAI / Anthropic / Google
- `text/reasoning` → Gemini 2.5 Pro / GPT-5
- `image/generate` → Flux / DALL-E / Stable Diffusion
- `video/generate` → Gen-3 / Pika / Sora
- `audio/tts` → ElevenLabs / OpenAI TTS
- `audio/stt` → Whisper
- `embed` → text-embedding / Voyage

**Routing strategies (mirror of `AIGatewayCore.tsx` load balancing strategies):**
- `latency-first` — choose lowest measured latency provider
- `cost-optimized` — choose cheapest per-token/per-image
- `quality-first` — choose highest ranked model
- `weighted-load` — distribute by current load percentage
- `round-robin` — distribute evenly
- `geo-aware` — choose nearest datacenter region

---

### `gateway/ToolRouter.ts`

Handles function calling and tool selection for agent tasks.

**Responsibilities:**
- Parse tool call intent from LLM response
- Map tool name to concrete implementation
- Execute tool and return result
- Handle tool errors with retry logic

---

### `gateway/ExecutionEngine.ts`

Executes the resolved task: calls the provider, handles streaming, collects result.

**Responsibilities:**
- Call `provider.chat()`, `provider.vision()`, `provider.tts()`, etc.
- If streaming: pipe chunks to WebSocket via `StreamHandler`
- If sync: collect full response, return to GatewayCore
- Handle provider errors: timeout, rate limit, 5xx → trigger fallback via SuperRouter

---

### `providers/BaseProvider.ts`

Abstract interface all provider adapters must implement:

```typescript
interface BaseProvider {
  readonly name: string;
  readonly supportedTaskTypes: TaskType[];

  chat(messages: Message[], config: ChatConfig): Promise<string>;
  chatStream(messages: Message[], config: ChatConfig): AsyncGenerator<string>;
  vision(imageBase64: string, prompt: string, config: VisionConfig): Promise<string>;
  embed(texts: string[], model: string): Promise<number[][]>;
  tts(text: string, config: TTSConfig): Promise<Buffer>;
  stt(audioBuffer: Buffer, config: STTConfig): Promise<string>;
  isAvailable(): Promise<boolean>;
  getLatencyEstimate(): number;
  getCostEstimate(tokens: number, type: TaskType): number;
}
```

---

### `providers/VisionProvider.ts`

Unified vision facade. Routes frame analysis to the appropriate model based on config.

**Source:** Mirrors the `VisionService.ts` interface from `gaze-speak-ai`, but instead of mock responses, calls real provider:
```typescript
analyzeFrame(frameBase64: string, prompt?: string): Promise<string>
```

**Default model hierarchy:** GPT-4o Vision → Gemini 2.0 Flash Vision → Claude Vision

---

### `providers/ElevenLabsProvider.ts`

TTS streaming provider. Maps to the `VoiceService.speak()` functionality but server-side.

**When to use server-side TTS:**
- When browser's `SpeechSynthesis` quality is insufficient
- When voice consistency across devices is required
- When generating audio files for storage

---

### `agents/AgentSystem.ts`

Manages the lifecycle of all agents defined in `Agents.tsx`.

**Agent states:** `idle → starting → running → paused → stopped → error`

**Capabilities (from Agents.tsx):**
- `Vision` — uses VisionProvider
- `Image` — uses ImagePipeline
- `Video` — uses VideoPipeline
- `Code` — uses code execution sandbox
- `Browsing` — uses web search tool
- `Analytics` — uses data analysis tools

---

### `workflows/WorkflowEngine.ts`

Backend execution engine for workflows built in `AIAutomationBuilder.tsx`.

**Input:** ReactFlow graph exported as JSON `{ nodes: Node[], edges: Edge[] }`

**Execution:**
1. Build DAG from edges
2. Find trigger nodes (in-degree = 0)
3. Execute nodes in topological order
4. Emit progress events via WebSocket

**Node types** (mirror of `nodeConfig` in `AIAutomationBuilder.tsx`):
- `trigger` — entry point
- `prompt` — template formatting
- `ai-model` — calls SuperRouter
- `image-generator` — calls ImagePipeline
- `video-generator` — calls VideoPipeline
- `voice-generator` — calls AudioPipeline
- `api-call` — HTTP request
- `storage` — DB write

---

### `auth/JWTMiddleware.ts`

**Source pattern:** Based on the config structure in `AdminDashboard.tsx` from gaze-speak-ai (API key management, rate limiting, logging toggle).

**Implementation:**
- Reads `Authorization: Bearer <token>` header
- Verifies with `jsonwebtoken`
- Attaches decoded `{ userId, workspaceId, role }` to `req.user`
- Rejects expired or invalid tokens with 401

---

### `logging/UsageLogger.ts`

**Source pattern:** Based on `AssistantService.ts` from gaze-speak-ai (message history pattern extended to persistent storage).

**Logs per request:**
- `provider` — which provider was used
- `model` — exact model name
- `task_type` — chat / vision / image / etc.
- `input_tokens`, `output_tokens`
- `cost_usd` — calculated from provider pricing
- `latency_ms`
- `status` — success / error / fallback
- `user_id`, `workspace_id`
- `timestamp`

**Feeds:** `Monitoring.tsx` (charts), `Logs.tsx` (log feed), `Usage.tsx` (billing)

---

### `websocket/WSHub.ts`

Manages WebSocket connections for real-time streaming.

**Clients:**
- `AIStudio` — token streaming for chat
- `LiveAIMode` — vision analysis results
- `VoiceAssistantPage` — audio stream
- `AIAutomationBuilder` — workflow execution progress

**Protocol (events.ts):**
```typescript
// Server → Client
{ type: 'chunk',    data: string }          // streaming token
{ type: 'done',     requestId: string }     // stream complete
{ type: 'error',    message: string }       // error occurred
{ type: 'progress', nodeId: string, status: string }  // workflow node status
```

---

## Database Schema

```sql
-- schema.sql

CREATE TABLE users (
  id          VARCHAR(36)  PRIMARY KEY,
  email       VARCHAR(255) UNIQUE NOT NULL,
  password    VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workspaces (
  id          VARCHAR(36)  PRIMARY KEY,
  user_id     VARCHAR(36)  REFERENCES users(id),
  name        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE api_keys (
  id          VARCHAR(36)  PRIMARY KEY,
  workspace_id VARCHAR(36) REFERENCES workspaces(id),
  key_hash    VARCHAR(255) NOT NULL,
  name        VARCHAR(255),
  rate_limit  INT          DEFAULT 60,
  is_active   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE usage_logs (
  id             VARCHAR(36) PRIMARY KEY,
  workspace_id   VARCHAR(36) REFERENCES workspaces(id),
  provider       VARCHAR(50),
  model          VARCHAR(100),
  task_type      VARCHAR(50),
  input_tokens   INT,
  output_tokens  INT,
  cost_usd       DECIMAL(10, 6),
  latency_ms     INT,
  status         VARCHAR(20),
  error_message  TEXT,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE workflows (
  id          VARCHAR(36)  PRIMARY KEY,
  workspace_id VARCHAR(36) REFERENCES workspaces(id),
  name        VARCHAR(255),
  graph_json  JSON         NOT NULL,
  is_active   BOOLEAN      DEFAULT FALSE,
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE workflow_runs (
  id          VARCHAR(36) PRIMARY KEY,
  workflow_id VARCHAR(36) REFERENCES workflows(id),
  status      VARCHAR(20),
  started_at  TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
  finished_at TIMESTAMP,
  output_json JSON
);

CREATE TABLE agents (
  id          VARCHAR(36)  PRIMARY KEY,
  workspace_id VARCHAR(36) REFERENCES workspaces(id),
  name        VARCHAR(255),
  system_prompt TEXT,
  capabilities JSON,
  status      VARCHAR(20)  DEFAULT 'idle',
  created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
);
```

---

## Environment Variables (`.env.example`)

```env
# Server
PORT=3001
NODE_ENV=development

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=ai_gateway
DB_USER=root
DB_PASSWORD=

# AI Providers
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...
ELEVENLABS_API_KEY=...
REPLICATE_API_KEY=r8_...

# Feature flags
ENABLE_STREAMING=true
ENABLE_USAGE_LOGGING=true
DEFAULT_ROUTING_STRATEGY=weighted-load
```
