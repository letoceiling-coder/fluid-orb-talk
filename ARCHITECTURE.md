# AI Gateway Platform — Full Architecture

## Overview

**fluid-orb-talk** is being transformed from a UI-only demo into a fully functional AI Gateway Platform.
The architecture separates concerns into five layers: Client, Gateway Core, Provider Adapters, Media Pipelines, and Infrastructure.

---

## Platform Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      CLIENT LAYER  (fluid-orb-talk frontend)                    │
│                                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  Dashboard   │  │  AI Studio   │  │ Media Studio │  │  Voice Studio    │   │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │  LiveAIMode  │  │  Agents      │  │  Automation  │  │  Monitoring      │   │
│  └──────────────┘  └──────────────┘  │  Builder     │  └──────────────────┘   │
│                                      └──────────────┘                          │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                     React Hooks Layer                                    │  │
│  │  useVoice · useCamera · useThemeToggle · use-mobile · use-toast          │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────────────────────┐  │
│  │                    Frontend Service Layer                                │  │
│  │  VoiceService · CameraService · VisionService · AssistantService         │  │
│  └──────────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────┬─────────────────────────────────────────────────────┘
                            │ REST + WebSocket
                            ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                      AI GATEWAY CORE  (backend)                                 │
│                                                                                 │
│  ┌────────────────────────────────────────────────────────────────────────┐    │
│  │                         GatewayCore                                    │    │
│  │              Central orchestrator — routes all requests                │    │
│  └────────────────────────┬───────────────────────────────────────────────┘    │
│                           │                                                     │
│         ┌─────────────────┼─────────────────┐                                  │
│         ▼                 ▼                 ▼                                   │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────────────┐           │
│  │ SuperRouter │  │  ToolRouter │  │      Execution Engine        │           │
│  │             │  │             │  │                              │           │
│  │ Routes by   │  │ Selects     │  │  ┌──────────────────────┐   │           │
│  │ task type   │  │ tool/func   │  │  │   Workflow Engine     │   │           │
│  │ & strategy  │  │ for task    │  │  │ (AIAutomationBuilder) │   │           │
│  └──────┬──────┘  └─────────────┘  │  └──────────────────────┘   │           │
│         │                          │  ┌──────────────────────┐   │           │
│         │                          │  │    Agent System       │   │           │
│         │                          │  │  (Agents page backend)│   │           │
│         │                          │  └──────────────────────┘   │           │
│         │                          └──────────────────────────────┘           │
└─────────┼────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        PROVIDER ADAPTERS                                        │
│                                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  OpenAI     │  │  Anthropic  │  │   Google    │  │    ElevenLabs       │  │
│  │  Adapter    │  │  Adapter    │  │  Adapter    │  │    Adapter (TTS)    │  │
│  │             │  │             │  │             │  │                     │  │
│  │ text/chat   │  │ text/chat   │  │ text/chat   │  │  voice synthesis    │  │
│  │ vision      │  │ vision      │  │ vision      │  │  stream audio       │  │
│  │ tts/stt     │  │             │  │             │  │                     │  │
│  │ embeddings  │  │             │  │             │  │                     │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│  ┌─────────────┐  ┌─────────────────────────────────────────────────────────┐ │
│  │  Replicate  │  │                  BaseProvider (interface)               │ │
│  │  Adapter    │  │  chat() · vision() · embed() · stream() · tts() · stt() │ │
│  │  img/video  │  └─────────────────────────────────────────────────────────┘ │
│  └─────────────┘                                                               │
└───────────────────────────────────────────────┬─────────────────────────────────┘
                                                │
                                                ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                        MEDIA PIPELINES                                          │
│                                                                                 │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │  Image Pipeline  │  │  Video Pipeline  │  │     Audio Pipeline           │ │
│  │                  │  │                  │  │                              │ │
│  │ text→image       │  │ text→video       │  │ text→speech (VoiceService)   │ │
│  │ image→image      │  │ image→video      │  │ speech→text (STT)            │ │
│  │ inpainting       │  │ video edit       │  │ audio generation             │ │
│  │ upscaling        │  │ lipsync          │  │                              │ │
│  └──────────────────┘  └──────────────────┘  └──────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────┐
│                        INFRASTRUCTURE                                           │
│                                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  JWT Auth    │  │  MySQL /     │  │ Usage Logger │  │  WebSocket Hub   │  │
│  │              │  │  SQLite DB   │  │              │  │                  │  │
│  │ API key mgmt │  │              │  │ Logs all     │  │ Token streaming  │  │
│  │ RBAC         │  │ Users        │  │ requests,    │  │ LiveAIMode       │  │
│  │ Rate limits  │  │ API keys     │  │ costs, errors│  │ AIStudio         │  │
│  │              │  │ Usage logs   │  │              │  │ VoiceAssistant   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### Chat Request Flow

```
User types in AIStudio
        │
        ▼
Frontend Service Layer (AssistantService.addMessage)
        │
        ▼ REST POST /api/v1/chat
GatewayCore.handle(request)
        │
        ▼
SuperRouter.route(request)
  ├── classify task type: text/chat
  ├── select strategy: latency / cost / quality
  └── pick provider: OpenAI → fallback Anthropic
        │
        ▼
OpenAIProvider.chat(messages, config)
        │
        ▼  (streaming)
WebSocket Hub → frontend
        │
        ▼
UsageLogger.log(request, response, cost, latency)
        │
        ▼
AssistantService.addMessage("assistant", content)
        │
        ▼
UI renders streamed response
```

### Vision + Voice Flow (LiveAIMode)

```
CameraService.captureFrame() → base64 JPEG
        │
        ▼
VoiceService.startListening() → SpeechRecognition → transcript
        │
        ▼ REST POST /api/v1/vision
VisionProvider.analyzeFrame(frameData, prompt)
        │
        ▼
OpenAIProvider.vision(image, prompt)  [or Gemini Vision]
        │
        ▼
response text → WebSocket → frontend
        │
        ▼
VoiceService.speak(response) → SpeechSynthesis TTS
```

### Automation Workflow Flow

```
User builds workflow in AIAutomationBuilder (ReactFlow canvas)
        │  (save as JSON graph)
        ▼ REST POST /api/v1/workflows
WorkflowEngine.create(graph)
        │
        ▼ (on trigger event)
WorkflowEngine.execute(workflowId, triggerPayload)
        │
        ▼
For each node in topological order:
  ├── TriggerNode    → emit payload
  ├── PromptNode     → format prompt
  ├── AIModelNode    → call SuperRouter
  ├── ImageGenNode   → call ImagePipeline
  ├── VoiceGenNode   → call AudioPipeline
  ├── APICallNode    → external HTTP request
  └── StorageNode    → save result to DB
        │
        ▼
WorkflowEngine emits progress events via WebSocket
        │
        ▼
AIAutomationBuilder shows live node status
```

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, shadcn/ui, ReactFlow, Framer Motion, Recharts |
| Backend | Node.js, Express or Fastify, TypeScript |
| Auth | JWT (jsonwebtoken), bcrypt |
| Database | MySQL (production), SQLite (development) |
| Real-time | WebSocket (ws or socket.io) |
| AI Providers | OpenAI SDK, Anthropic SDK, Google Generative AI SDK, ElevenLabs API |
| Media | Replicate API, Runway API, Pika API |
| Package manager | npm |

---

## Key Design Principles

1. **Provider abstraction** — all AI providers implement `BaseProvider` interface, making it trivial to add new providers or swap existing ones.
2. **Frontend-first** — the frontend service layer (VoiceService, CameraService, VisionService, AssistantService) works independently of the backend, enabling development and demos without a running server.
3. **Strategy-based routing** — the SuperRouter selects providers dynamically based on configurable strategies (latency, cost, quality, geo), directly matching the UI shown in `AISuperRouter.tsx`.
4. **Observable by design** — every request is logged by UsageLogger, feeding the real-time data into `Monitoring.tsx`, `Logs.tsx`, and `Usage.tsx`.
5. **Incremental migration** — each phase is independently deployable; mock data in UI can be replaced one endpoint at a time.
