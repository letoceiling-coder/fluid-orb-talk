# AI Gateway

## Entry Routes

External path (via Nginx):

- `POST /gateway/chat`
- `POST /gateway/vision`
- `POST /gateway/image`
- `POST /gateway/tts`
- `GET /gateway/stream` (WebSocket)

Backend internal path (Fastify root):

- `/chat`, `/vision`, `/image`, `/tts`, `/stream`

## Gateway Components

- `GatewayCore`:
  - validates request
  - routes through `SuperRouter`
  - executes through `ExecutionEngine`
  - logs usage
- `SuperRouter`:
  - selects providers by strategy
  - defines fallback chains per task type
- `ExecutionEngine`:
  - executes task against selected/fallback providers
  - supports chat streaming callback flow

## Routing Strategy

Supported strategies:

- `round-robin`
- `latency-first`
- `cost-optimized`
- `quality-first`
- `weighted-load`
- `geo-aware`

Default strategy from env: `DEFAULT_ROUTING_STRATEGY` (fallback in code to `quality-first`).

## Current Provider Matrix

- OpenAI: chat/vision/embed/tts/stt
- Anthropic: chat/vision
- Google: chat/vision/embed
- ElevenLabs: tts
- Replicate: image/video generation

## Fallback Chains

- chat/reasoning/vision:
  - `openai -> anthropic -> google`
- tts:
  - `elevenlabs -> openai`
- stt:
  - `openai`
- image/video:
  - `replicate`

## Response Normalization

Gateway chat response includes:

- `message`
- `model`
- `provider`
- `usage` (`prompt_tokens`, `completion_tokens`, `total_tokens`)

## Streaming

- WebSocket endpoint `/gateway/stream`
- Message types:
  - input: `chat`, `join_room`, `leave_room`, `ping`
  - output includes streamed chunks and completion/error events from `StreamHandler`

## Safety and Limits

- `MAX_MESSAGE_CHARS = 20000`
- Zod schema validation on gateway chat payload
- JWT or API key required for gateway routes
- Redis rate limits per endpoint bucket

