# Migration Strategy — fluid-orb-talk → AI Gateway Platform

This document defines the strategy and principles for transforming fluid-orb-talk from a UI demo into a production AI Gateway Platform, using reusable modules from gaze-speak-ai.

---

## Core Principles

1. **No big bang** — migrate incrementally. Each phase ships a working, deployable state.
2. **UI stays functional throughout** — mock data is replaced endpoint by endpoint, not all at once.
3. **No regression** — every existing page continues to render during migration.
4. **Additive, not destructive** — new services and hooks are added alongside existing code; old code is removed only after the new implementation is verified.
5. **Frontend-first** — the client layer works independently of the backend. VoiceService, CameraService, and AssistantService function in the browser without a server.

---

## Migration Phases Overview

```
Phase 1  ────────────────────────────────────────  Frontend Service Integration
           Bring gaze-speak-ai modules into fluid-orb-talk
           No backend required. All services run in browser.

Phase 2  ────────────────────────────────────────  Backend Scaffold + Core Chat
           Express backend with one real provider (OpenAI).
           REST endpoint for chat. JWT auth + API key management.

Phase 3  ────────────────────────────────────────  WebSocket Streaming
           Replace polling/static responses with live token streaming.
           Vision endpoint with real frame analysis.

Phase 4  ────────────────────────────────────────  Provider Ecosystem
           Add Anthropic, Google, ElevenLabs, Replicate adapters.
           SuperRouter with latency/cost/quality strategies.

Phase 5  ────────────────────────────────────────  Workflow + Agents
           WorkflowEngine for AIAutomationBuilder.
           AgentSystem for Agents page.
           UsageLogger feeds Monitoring / Logs / Usage pages.
```

---

## Phase 1 — Frontend Service Integration

**Goal:** Replace duplicate and inline media/voice/camera code in fluid-orb-talk with proper service and hook layer from gaze-speak-ai.

**What changes in fluid-orb-talk:**

| Action | Details |
|--------|---------|
| Add `src/services/VoiceService.ts` | Copy from gaze-speak-ai. No changes needed. |
| Add `src/services/CameraService.ts` | Copy from gaze-speak-ai. No changes needed. |
| Add `src/services/VisionService.ts` | Copy from gaze-speak-ai. Mark `analyzeFrame()` as stub for Phase 3. |
| Add `src/services/AssistantService.ts` | Copy from gaze-speak-ai. |
| Add `src/hooks/useVoice.ts` | Copy from gaze-speak-ai. |
| Add `src/hooks/useCamera.ts` | Copy from gaze-speak-ai. |
| Add `src/hooks/useThemeToggle.tsx` | Copy from gaze-speak-ai. |
| Add `src/components/assistant/` | Copy all 7 components from gaze-speak-ai. |
| Add `src/components/vision/CameraOverlay.tsx` | Copy from gaze-speak-ai. |
| Add `src/components/vision/ControlPanel.tsx` | Copy from gaze-speak-ai. |
| Add `src/components/voice/VoiceWaveform.tsx` | Copy from gaze-speak-ai. |
| Refactor `LiveAIMode.tsx` | Replace inline camera stream code with `useCamera` + `useVoice`. Add `CameraOverlay`. |
| Refactor `VoiceAssistantPage.tsx` | Replace `setInterval` waveform simulation with `useVoice` + `VoiceWaveform`. |
| Refactor `VideoAssistant.tsx` | Replace inline `getUserMedia` with `useCamera`. |
| Refactor `MultimodalChat.tsx` | Use `AssistantService` for history, `ChatPanel` + `ChatInput`. |

**Deliverable:** All live/voice/vision pages work in browser with real microphone and camera. AI responses are still mock (contextual keyword matching from VisionService).

**No backend needed.** Deploy as static site.

---

## Phase 2 — Backend Scaffold + Core Chat

**Goal:** Stand up the backend with a single working endpoint. Connect `AIStudio` to real OpenAI chat.

**Backend setup:**
```
backend/
├── src/
│   ├── index.ts
│   ├── app.ts
│   ├── gateway/GatewayCore.ts
│   ├── providers/BaseProvider.ts
│   ├── providers/OpenAIProvider.ts  ← only provider in this phase
│   ├── auth/JWTMiddleware.ts
│   ├── auth/ApiKeyManager.ts
│   ├── routes/chat.ts               ← POST /api/v1/chat (non-streaming)
│   ├── routes/auth.ts               ← POST /api/v1/auth/login
│   ├── routes/keys.ts               ← GET/POST/DELETE /api/v1/keys
│   ├── logging/UsageLogger.ts       ← write to SQLite in dev
│   └── db/DatabaseClient.ts
```

**Frontend changes:**
- `AIStudio.tsx` — replace hardcoded chat responses with `fetch('/api/v1/chat', ...)`
- `ApiKeys.tsx` — connect to `/api/v1/keys` endpoints
- `Settings.tsx` — replace sessionStorage pattern with JWT login flow

**Deliverable:** AIStudio sends real messages to OpenAI. API key management is functional. Usage is logged to SQLite.

---

## Phase 3 — WebSocket Streaming

**Goal:** Replace request/response pattern with real-time token streaming. Connect VisionService to a real backend endpoint.

**Backend additions:**
```
backend/src/
├── websocket/WSHub.ts
├── websocket/StreamHandler.ts
├── websocket/events.ts
└── routes/vision.ts       ← POST /api/v1/vision
```

**Frontend changes:**
- `AIStudio.tsx` — switch from REST fetch to WebSocket for streaming tokens
- `LiveAIMode.tsx` — `VisionService.analyzeFrame()` now calls `POST /api/v1/vision`
- `MultimodalChat.tsx` — stream tokens as they arrive
- All streaming pages show real `ThinkingIndicator` while waiting

**Deliverable:** Chat streams token by token. Camera frames are analyzed by real GPT-4o Vision. LiveAIMode is fully functional.

---

## Phase 4 — Provider Ecosystem

**Goal:** Add all providers from the model catalog in `AIGatewayCore.tsx`. Make SuperRouter functional with routing strategies.

**Backend additions:**
```
backend/src/providers/
├── AnthropicProvider.ts
├── GoogleProvider.ts
├── ElevenLabsProvider.ts
├── ReplicateProvider.ts
└── ProviderRegistry.ts

backend/src/gateway/
├── SuperRouter.ts         ← full implementation with strategies
└── ExecutionEngine.ts     ← fallback handling
```

**Frontend changes:**
- `AIGatewayCore.tsx` — model status, latency, load percentages come from `GET /api/v1/models`
- `AISuperRouter.tsx` — provider stats, routing rules from `GET /api/v1/usage?group=provider`
- `AIModelHub.tsx` — model catalog from `GET /api/v1/models`
- `MediaStudio.tsx` / `DemoMediaGenerator.tsx` — image/video generation via `POST /api/v1/media/image`
- `VoiceStudio.tsx` — TTS via ElevenLabs `POST /api/v1/media/audio`

**Deliverable:** All 5 routing strategies work. Fallback logic is active. Media generation is real.

---

## Phase 5 — Workflow + Agents

**Goal:** Make `AIAutomationBuilder` execute real workflows. Make `Agents` run real agents. Feed real data into all monitoring pages.

**Backend additions:**
```
backend/src/
├── workflows/WorkflowEngine.ts
├── workflows/WorkflowStore.ts
├── workflows/nodes/          ← all node executors
├── agents/AgentSystem.ts
├── agents/AgentRunner.ts
└── agents/agents/            ← concrete agent implementations
```

**Frontend changes:**
- `AIAutomationBuilder.tsx` — save workflow graph to `POST /api/v1/workflows`, run via `POST /api/v1/workflows/:id/run`
- `Agents.tsx` — create/start agents via `/api/v1/agents`
- `Monitoring.tsx` — latency chart from `GET /api/v1/monitoring/latency`
- `Logs.tsx` — log feed from `GET /api/v1/logs`
- `Usage.tsx` — billing data from `GET /api/v1/usage`
- `Datasets.tsx` — file uploads to `POST /api/v1/storage`
- `Storage.tsx` — file listing from `GET /api/v1/storage`

**Deliverable:** Full AI Gateway Platform operational. All pages show real data. No mock data remaining.

---

## Risk Mitigation

| Risk | Mitigation |
|------|-----------|
| Browser Speech API not available in all browsers | VoiceService already has simulation fallback; server-side TTS (ElevenLabs) available in Phase 4 |
| Camera permissions denied | CameraService returns clear error string; UI shows error state |
| Provider API key not configured | GatewayCore checks provider availability before routing; returns 503 with clear message |
| Provider rate limit hit | SuperRouter triggers fallback to next provider in strategy list |
| WebSocket connection drops | StreamHandler implements reconnect with exponential backoff |
| ReactFlow graph has cycles | WorkflowEngine validates DAG structure before execution; returns 400 for invalid graphs |

---

## Compatibility Notes

- **fluid-orb-talk and gaze-speak-ai share the same UI stack** (React, TypeScript, TailwindCSS, shadcn/ui, Framer Motion). All components copy over without style conflicts.
- **The `glass-panel` and `glow-border` CSS classes** used in gaze-speak-ai are present in fluid-orb-talk's `index.css`. No style additions needed.
- **shadcn/ui component set is identical** in both projects. No duplicate installations.
- **Vite aliasing (`@/`)** is configured identically in both projects. Import paths work as-is after copying.
