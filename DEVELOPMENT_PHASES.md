# Development Phases — AI Gateway Platform

Detailed task breakdown for each migration phase. Each task is a self-contained unit of work.

---

## Phase 1 — Frontend Service Integration

**Estimated effort:** 2–3 days  
**Dependencies:** None (no backend)  
**Outcome:** Real microphone, camera, and voice synthesis in all live pages

---

### 1.1 — Copy service layer from gaze-speak-ai

- [ ] Create `src/services/` directory in fluid-orb-talk (if not present)
- [ ] Copy `VoiceService.ts` → `src/services/VoiceService.ts`
- [ ] Copy `CameraService.ts` → `src/services/CameraService.ts`
- [ ] Copy `VisionService.ts` → `src/services/VisionService.ts`
  - Add comment: `// TODO Phase 3: replace analyzeFrame() body with POST /api/v1/vision`
- [ ] Copy `AssistantService.ts` → `src/services/AssistantService.ts`

### 1.2 — Copy hooks from gaze-speak-ai

- [ ] Copy `useVoice.ts` → `src/hooks/useVoice.ts`
- [ ] Copy `useCamera.ts` → `src/hooks/useCamera.ts`
- [ ] Copy `useThemeToggle.tsx` → `src/hooks/useThemeToggle.tsx`

### 1.3 — Copy UI components from gaze-speak-ai

- [ ] Create `src/components/assistant/` directory
- [ ] Copy `ActivationButton.tsx`
- [ ] Copy `ChatPanel.tsx`
- [ ] Copy `ChatInput.tsx`
- [ ] Copy `ResponseCard.tsx`
- [ ] Copy `StatusIndicator.tsx`
- [ ] Copy `SuggestedQuestions.tsx`
- [ ] Copy `ThinkingIndicator.tsx`
- [ ] Create `src/components/vision/` directory (if not present)
- [ ] Copy `CameraOverlay.tsx`
- [ ] Copy `ControlPanel.tsx`
- [ ] Create `src/components/voice/` directory (if not present)
- [ ] Copy `VoiceWaveform.tsx`

### 1.4 — Refactor `LiveAIMode.tsx`

**Current state:** 50+ lines of inline `getUserMedia`, `MediaStream` refs, fake waveform animation, hardcoded `cannedConversation` responses.

- [ ] Replace inline camera stream code with `useCamera` hook
- [ ] Replace inline `SpeechRecognition` code with `useVoice` hook
- [ ] Replace hardcoded `cannedConversation` array with `visionService.analyzeFrame()`
- [ ] Add `<CameraOverlay isActive={isActive} isAnalyzing={isAnalyzing} />` over `<video>`
- [ ] Add `<StatusIndicator state={aiState} />` to top bar
- [ ] Replace manual waveform `setInterval` with `<VoiceWaveform isActive={isListening} />`
- [ ] Add `assistantService` for conversation history
- [ ] Remove all now-unused `useRef<MediaStream>` and `useEffect` camera code

### 1.5 — Refactor `VoiceAssistantPage.tsx`

**Current state:** `setInterval` waveform simulation, `cannedResponses` array, no real speech.

- [ ] Replace waveform simulation with `useVoice` hook + `<VoiceWaveform>`
- [ ] Replace `cannedResponses` with `visionService.analyzeFrame("", transcript)` as interim
- [ ] Add `<StatusIndicator state={orbState} />`
- [ ] Keep existing animated orb UI — only replace data sources

### 1.6 — Refactor `VideoAssistant.tsx`

- [ ] Replace inline `getUserMedia` / `MediaStream` with `useCamera` hook
- [ ] Replace inline recording simulation with `cameraService.captureFrame()`
- [ ] Add `<CameraOverlay>` for visual feedback

### 1.7 — Refactor `MultimodalChat.tsx`

- [ ] Import `AssistantService` for conversation history management
- [ ] Replace local `messages` state with `assistantService.history`
- [ ] Add `<ChatPanel>` and `<ChatInput>` components
- [ ] Add `<ThinkingIndicator>` while waiting for response

### 1.8 — Connect theme toggle in `Settings.tsx`

- [ ] Import `useThemeToggle` from `src/hooks/useThemeToggle.tsx`
- [ ] Replace any existing theme logic with the hook
- [ ] Verify dark/light mode persists across page reloads

### 1.9 — Verify Phase 1

- [ ] Open `LiveAIMode` in browser — camera feed works, mic records real audio, voice plays back
- [ ] Open `VoiceAssistantPage` — mic activates, waveform animates with real audio
- [ ] Open `VideoAssistant` — camera activates, frame capture works
- [ ] Open `MultimodalChat` — messages appear in ChatPanel with history
- [ ] Theme toggle persists after page reload

---

## Phase 2 — Backend Scaffold + Core Chat

**Estimated effort:** 3–5 days  
**Dependencies:** Phase 1 complete, Node.js installed, OpenAI API key  
**Outcome:** AIStudio sends real messages to OpenAI; JWT auth works; API keys are stored in DB

---

### 2.1 — Initialize backend project

- [ ] Create `backend/` directory at repo root
- [ ] Run `npm init -y` in `backend/`
- [ ] Install dependencies: `express`, `typescript`, `ts-node`, `openai`, `jsonwebtoken`, `bcrypt`, `better-sqlite3` (dev), `dotenv`, `cors`, `@types/*`
- [ ] Create `backend/tsconfig.json` with `strict: true`, `module: NodeNext`
- [ ] Create `backend/.env.example` with all required variables
- [ ] Create `backend/.env` locally (git-ignored)

### 2.2 — Database setup

- [ ] Create `backend/src/db/schema.sql` (tables: `users`, `workspaces`, `api_keys`, `usage_logs`)
- [ ] Create `backend/src/db/DatabaseClient.ts` (SQLite in dev, MySQL in prod)
- [ ] Run schema migration on `npm start`

### 2.3 — Auth layer

- [ ] Implement `backend/src/auth/JWTMiddleware.ts`
  - Read `Authorization: Bearer <token>`
  - Verify with `JWT_SECRET`
  - Attach `req.user` to request
- [ ] Implement `backend/src/auth/ApiKeyManager.ts`
  - `generateKey(workspaceId)` → store hash in DB, return raw key once
  - `validateKey(rawKey)` → hash and compare, return workspace
  - `revokeKey(keyId)` → set `is_active = false`
- [ ] Implement `POST /api/v1/auth/login` → return JWT
- [ ] Implement `GET/POST/DELETE /api/v1/keys`

### 2.4 — OpenAI provider

- [ ] Implement `backend/src/providers/BaseProvider.ts` interface
- [ ] Implement `backend/src/providers/OpenAIProvider.ts`
  - `chat(messages, config)` → OpenAI chat completions
  - `vision(imageBase64, prompt)` → GPT-4o Vision
  - `embed(texts, model)` → text-embedding-3-small
  - `isAvailable()` → ping API, return bool

### 2.5 — Gateway Core (minimal)

- [ ] Implement `GatewayCore.ts` — validate request, call OpenAI provider, return response
- [ ] Implement `POST /api/v1/chat` route
  - Accept: `{ messages: Message[], model?: string }`
  - Validate JWT or API key
  - Call GatewayCore
  - Return: `{ response: string, usage: { inputTokens, outputTokens, cost } }`
- [ ] Implement `UsageLogger.ts` — write to `usage_logs` table after each request

### 2.6 — Connect AIStudio to backend

- [ ] Add `VITE_API_URL=http://localhost:3001` to `fluid-orb-talk/.env`
- [ ] Create `src/services/ApiService.ts` in frontend — base fetch wrapper with auth header
- [ ] Replace hardcoded chat responses in `AIStudio.tsx` with `POST /api/v1/chat` call
- [ ] Show loading state while waiting for response
- [ ] Handle error responses gracefully

### 2.7 — Connect ApiKeys page

- [ ] `ApiKeys.tsx` — fetch key list from `GET /api/v1/keys`
- [ ] Create key button calls `POST /api/v1/keys`
- [ ] Delete key button calls `DELETE /api/v1/keys/:id`
- [ ] Show key only once on creation (masked after)

### 2.8 — Verify Phase 2

- [ ] Start backend: `cd backend && npm run dev`
- [ ] Start frontend: `cd fluid-orb-talk && npm run dev`
- [ ] AIStudio: type a message → receive real OpenAI response
- [ ] ApiKeys: create and delete API keys
- [ ] Usage logs appear in SQLite DB

---

## Phase 3 — WebSocket Streaming

**Estimated effort:** 2–4 days  
**Dependencies:** Phase 2 complete  
**Outcome:** Chat streams token by token; camera frames analyzed by real GPT-4o Vision

---

### 3.1 — WebSocket server

- [ ] Install `ws` package in backend
- [ ] Implement `backend/src/websocket/WSHub.ts`
  - Track connections by `clientId`
  - Authenticate connection with token in query param
  - Handle `message` events
- [ ] Implement `backend/src/websocket/StreamHandler.ts`
  - Pipe async generator from OpenAI stream to WS client
  - Emit `{ type: 'chunk', data }` for each token
  - Emit `{ type: 'done', requestId }` on completion
  - Emit `{ type: 'error', message }` on failure
- [ ] Define `backend/src/websocket/events.ts` — all event type definitions

### 3.2 — Streaming chat endpoint

- [ ] Update `OpenAIProvider.ts` — add `chatStream()` using `openai.chat.completions.create({ stream: true })`
- [ ] Update `POST /api/v1/chat` — when `stream: true` in request body, switch to WebSocket streaming
- [ ] Update `GatewayCore.ts` to route streaming vs sync requests

### 3.3 — Vision endpoint

- [ ] Implement `backend/src/routes/vision.ts`
  - `POST /api/v1/vision` — accept `{ frame: string (base64), prompt: string }`
  - Call `OpenAIProvider.vision(frame, prompt)`
  - Return `{ response: string }`
- [ ] Update `VisionService.ts` in frontend — replace mock body with `fetch('/api/v1/vision', ...)`

### 3.4 — Connect frontend to WebSocket streaming

- [ ] Create `src/services/WSService.ts` in frontend — WebSocket connection manager with reconnect
- [ ] Update `AIStudio.tsx` — use WebSocket stream for chat; append tokens as they arrive
- [ ] Update `LiveAIMode.tsx` — `VisionService.analyzeFrame()` now calls backend
- [ ] Update `MultimodalChat.tsx` — streaming tokens with `ThinkingIndicator` → `ResponseCard`

### 3.5 — Verify Phase 3

- [ ] AIStudio: typing message streams tokens one by one
- [ ] LiveAIMode: camera frame sent to backend → real vision analysis returned → TTS plays it
- [ ] Disconnect/reconnect WebSocket — stream resumes correctly

---

## Phase 4 — Provider Ecosystem

**Estimated effort:** 4–6 days  
**Dependencies:** Phase 3 complete, all provider API keys  
**Outcome:** Full model catalog active; SuperRouter with strategies; media generation works

---

### 4.1 — Additional provider adapters

- [ ] Implement `AnthropicProvider.ts` — `chat()`, `chatStream()`, `vision()` using Anthropic SDK
- [ ] Implement `GoogleProvider.ts` — `chat()`, `chatStream()`, `vision()` using Google Generative AI SDK
- [ ] Implement `ElevenLabsProvider.ts` — `tts(text, config)` → returns audio Buffer
- [ ] Implement `ReplicateProvider.ts` — `generateImage(prompt, config)`, `generateVideo(prompt, config)` via Replicate API
- [ ] Implement `ProviderRegistry.ts` — register all providers; `getProvider(name)`, `getAvailableProviders(taskType)`

### 4.2 — SuperRouter full implementation

- [ ] Implement `SuperRouter.ts` with all 6 routing strategies from `AIGatewayCore.tsx`:
  - `round-robin` — cycle through providers
  - `weighted-load` — select based on current load percentage
  - `latency-first` — select lowest measured latency
  - `cost-optimized` — select cheapest per-token cost
  - `quality-first` — select highest-ranked model
  - `geo-aware` — select based on datacenter region config
- [ ] Implement fallback chain: primary provider fails → try fallback → log failure
- [ ] Read routing rules from `routing_rules` table (seeded from `AISuperRouter.tsx` hardcoded rules)

### 4.3 — Media endpoints

- [ ] Implement `backend/src/media/ImagePipeline.ts`
  - `generate(prompt, config)` → call ReplicateProvider (Flux/SDXL)
  - Return image URL or base64
- [ ] Implement `backend/src/media/VideoPipeline.ts`
  - `generate(prompt, config)` → call Runway/Pika via Replicate
- [ ] Implement `backend/src/media/AudioPipeline.ts`
  - `tts(text, config)` → call ElevenLabsProvider
  - `stt(audioBuffer, config)` → call OpenAI Whisper
- [ ] Implement `POST /api/v1/media/image`, `POST /api/v1/media/video`, `POST /api/v1/media/audio`

### 4.4 — Connect frontend model catalog pages

- [ ] Create `GET /api/v1/models` endpoint — return all registered providers and models with live status
- [ ] Update `AIGatewayCore.tsx` — replace hardcoded `modelCategories` array with API call
- [ ] Update `AIModelHub.tsx` — fetch model list from API
- [ ] Update `AISuperRouter.tsx` — provider stats from `GET /api/v1/usage?group=provider`
- [ ] Update `MediaStudio.tsx` — image/video generation via media endpoints
- [ ] Update `VoiceStudio.tsx` — TTS preview via audio endpoint

### 4.5 — Verify Phase 4

- [ ] `AIGatewayCore.tsx` shows live provider status (not mock)
- [ ] MediaStudio generates a real image via Flux/SDXL
- [ ] VoiceStudio previews TTS via ElevenLabs
- [ ] SuperRouter falls back to Anthropic when OpenAI returns 429

---

## Phase 5 — Workflow + Agents

**Estimated effort:** 5–7 days  
**Dependencies:** Phase 4 complete  
**Outcome:** Full platform operational; all pages show real data; no mock data remaining

---

### 5.1 — WorkflowEngine

- [ ] Implement `backend/src/workflows/nodes/BaseNode.ts` — `execute(input, context): Promise<output>`
- [ ] Implement all 8 node types: TriggerNode, PromptNode, AIModelNode, ImageGeneratorNode, VideoGeneratorNode, VoiceGeneratorNode, APICallNode, StorageNode
- [ ] Implement `WorkflowStore.ts` — save/load workflow graphs from `workflows` table
- [ ] Implement `WorkflowEngine.ts`
  - `create(graph)` — validate DAG, store
  - `execute(workflowId, payload)` — topological sort + execute nodes
  - Emit WebSocket progress events per node: `{ type: 'progress', nodeId, status, output }`
  - Store run result in `workflow_runs` table
- [ ] Implement `POST /api/v1/workflows` — create workflow
- [ ] Implement `POST /api/v1/workflows/:id/run` — execute workflow
- [ ] Implement `GET /api/v1/workflows/:id/runs` — execution history

### 5.2 — Connect AIAutomationBuilder to backend

- [ ] Add "Save" button in `AIAutomationBuilder.tsx` → export ReactFlow graph → `POST /api/v1/workflows`
- [ ] Add "Run" button → `POST /api/v1/workflows/:id/run`
- [ ] Subscribe to WebSocket progress events → update node status badge in real time (`WorkflowNode` component already has `data.status` rendering)
- [ ] Add workflow list panel (saved workflows sidebar)

### 5.3 — AgentSystem

- [ ] Implement `backend/src/agents/agents/BaseAgent.ts`
- [ ] Implement all 4 agent types: VideoCreatorAgent, ImageCreatorAgent, ResearchAgent, MarketingAgent
- [ ] Implement `AgentRunner.ts` — step loop: plan → execute tool → observe → repeat
- [ ] Implement `AgentSystem.ts` — lifecycle management
- [ ] Implement `POST /api/v1/agents` — create agent
- [ ] Implement `POST /api/v1/agents/:id/start` — start agent
- [ ] Implement `GET /api/v1/agents/:id/status` — poll status
- [ ] Implement `POST /api/v1/agents/:id/stop`

### 5.4 — Connect Agents page to backend

- [ ] `Agents.tsx` — create agent form calls `POST /api/v1/agents`
- [ ] Agent card start/stop buttons call agent lifecycle endpoints
- [ ] Agent status badge polls `GET /api/v1/agents/:id/status`
- [ ] Agent output stream via WebSocket

### 5.5 — Connect monitoring pages

- [ ] Implement `GET /api/v1/monitoring/latency` — 24h latency data per model (feeds `Monitoring.tsx` chart)
- [ ] Implement `GET /api/v1/logs` — paginated log feed (feeds `Logs.tsx`)
- [ ] Implement `GET /api/v1/usage` — aggregated cost + token data by period (feeds `Usage.tsx`)
- [ ] Update `Monitoring.tsx` — replace `latencyData` array with API call
- [ ] Update `Logs.tsx` — replace hardcoded log entries with API call
- [ ] Update `Usage.tsx` — replace hardcoded billing data with API call

### 5.6 — Storage and Datasets

- [ ] Implement file upload/download to local storage or S3-compatible bucket
- [ ] Implement `POST /api/v1/storage` — upload file
- [ ] Implement `GET /api/v1/storage` — list files
- [ ] Implement `DELETE /api/v1/storage/:id`
- [ ] Update `Storage.tsx` and `Datasets.tsx` to use real file storage

### 5.7 — Final cleanup

- [ ] Remove all remaining hardcoded mock data from frontend pages
- [ ] Remove `test-commit*.txt` files from repo root
- [ ] Ensure all environment variables are documented in `.env.example`
- [ ] Update `README.md` with setup instructions for both frontend and backend
- [ ] Run `npm run build` in fluid-orb-talk — verify no errors
- [ ] Run `npm run build` in backend — verify no TypeScript errors

### 5.8 — Verify Phase 5

- [ ] Create a workflow in AIAutomationBuilder: trigger → GPT-5 → image generator → storage
- [ ] Run the workflow — nodes animate through execution states in real time
- [ ] Create a Research Agent — start it — observe it browsing and generating a report
- [ ] Check Monitoring page — latency chart shows real data from the last 24h
- [ ] Check Logs page — all requests from Phases 2–5 appear in the feed
- [ ] Check Usage page — token counts and costs match actual API usage

---

## Summary

| Phase | Duration | Blocked by | Risk |
|-------|----------|-----------|------|
| Phase 1 | 2–3 days | — | Low |
| Phase 2 | 3–5 days | Phase 1 | Low |
| Phase 3 | 2–4 days | Phase 2 | Medium |
| Phase 4 | 4–6 days | Phase 3 | Medium |
| Phase 5 | 5–7 days | Phase 4 | High |
| **Total** | **16–25 days** | | |

The highest risk phase is Phase 5 (Workflow + Agents) due to the complexity of the DAG execution engine and agent step loop. Phases 1–3 can be shipped independently and provide significant value before Phase 5 begins.
