# Development Workflow

## Local Workflow

From repository root:

```bash
npm install
npm run dev
```

Backend local:

```bash
cd backend
npm install
npm run dev
```

## Git Workflow

- Branch in use: `main`
- Typical flow:
  1. `git fetch origin`
  2. implement changes
  3. `git add ...`
  4. `git commit`
  5. `git push origin main`

## Sync Rule Applied in This Project

During stabilization, practical source precedence was:

1. production server runtime state
2. server git tree
3. local machine

This prevented code loss when server state had newer fixes.

## Server/Git Synchronization Notes

- Runtime path: `/var/www/ai-gateway`
- Server git path: `/tmp/fluid-orb-talk-build`
- If runtime and git tree diverge, synchronize runtime files into git tree before commit/push.

## Safety Rules

- Do not commit `.env`, `node_modules`, `dist`.
- Do not run destructive git commands unless explicitly requested.
- Verify auth + gateway critical endpoints after deployment.

## Suggested Verify Checklist per Change

- `POST /auth/login` works
- `GET /auth/me` works with token
- `POST /gateway/chat` works
- frontend login redirects to `/dashboard`
- protected routes redirect to `/login` when unauthorized

