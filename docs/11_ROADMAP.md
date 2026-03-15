# Roadmap (Based on Current Code)

## Completed Foundations

- Auth architecture with JWT + refresh flow
- Protected frontend routing and dashboard UX
- Sidebar user panel with profile/logout
- PostgreSQL conversation memory and message persistence
- Gateway provider integrations (OpenAI/Anthropic/Google/ElevenLabs/Replicate)
- Redis-backed distributed rate limiting for gateway endpoints
- Usage logging with token metrics

## Recommended Next Milestones

### 1. Consolidate API Surface

- Unify `/gateway/*` and `/api/v1/*` route responsibilities.
- Remove or refactor legacy skeleton endpoints that are not production-critical.

### 2. Finish Workflow/Agent Runtime

- Many workflow/agent modules are scaffolded.
- Implement end-to-end execution and persistence contracts.

### 3. Strengthen Frontend Integration

- Ensure all assistant pages use consistent controller + service contracts.
- Expand test coverage for camera/voice/streaming race conditions.

### 4. Observability Improvements

- Add explicit latency capture in message writes (`latency_ms` currently often placeholder `0`).
- Add dashboard KPIs from `usage_logs`.

### 5. CI/CD and Release Safety

- Add automated lint/build/test gates.
- Add migration execution checks and smoke tests in deployment pipeline.

### 6. Security Hardening Follow-ups

- Ensure API key lifecycle endpoints are fully aligned with PostgreSQL schema (workspace/user relation consistency).
- Add stricter CORS and environment separation per stage.

## Operational Priorities

1. Keep auth + gateway + conversation flows stable.
2. Preserve `SERVER = GIT = LOCAL` sync discipline.
3. Avoid architecture redesign until route/module consolidation plan is approved.

