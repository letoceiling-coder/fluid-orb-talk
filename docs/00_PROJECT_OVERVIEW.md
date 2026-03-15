# AI Gateway Platform - Project Overview

## Purpose

`fluid-orb-talk` is a React + Fastify platform that combines:

- multi-page AI frontend (dashboard, assistants, gateway controls),
- backend AI gateway with provider routing/fallback,
- PostgreSQL conversation/auth storage,
- Redis rate limiting,
- Nginx + PM2 production deployment.

This document describes the **current implemented state**, not a target-only design.

## Environments

- **Production server IP:** `89.169.39.244`
- **Public domain:** `https://crm.al.siteaccess.ru`
- **Backend runtime port:** `5000`

## Main Directories

- Local repo root: `c:\OSPanel\domains\al-temp\fluid-orb-talk`
- Frontend source: `src`
- Backend source: `backend/src`
- Server frontend runtime: `/var/www/ai-gateway/dist`
- Server backend runtime: `/var/www/ai-gateway/backend`
- Server build/git working tree used for synchronization: `/tmp/fluid-orb-talk-build`

## Tech Stack (actual)

- Frontend: React 18, TypeScript, Vite, React Router, React Query, Tailwind/shadcn
- Backend: Node.js, TypeScript, Fastify, `@fastify/jwt`, `@fastify/websocket`
- Database: PostgreSQL (`pg`)
- Rate limiting: Redis (`redis`)
- AI providers: OpenAI, Anthropic, Google Gemini, ElevenLabs, Replicate
- Process manager: PM2
- Reverse proxy: Nginx

## Core Functional Areas

- Auth system (`/auth/*` and `/api/v1/auth/*`)
- Conversation memory (`/conversations*`)
- AI gateway endpoints (`/gateway/chat`, `/gateway/vision`, `/gateway/image`, `/gateway/tts`, `/gateway/stream`)
- Legacy/module routes under `/api/v1/*` (partially operational, some still skeleton/stub)
- Frontend protected app routes with auth guard and sidebar user panel

## Current Stability Notes

- PostgreSQL is the active persistence layer in runtime backend.
- Redis rate limiting is active for gateway cost-generating routes.
- Auth endpoint errors are localized in Russian in `backend/src/routes/auth.ts`.
- Frontend login redirects to `/dashboard`; sidebar shows user name/email/role and supports logout.

