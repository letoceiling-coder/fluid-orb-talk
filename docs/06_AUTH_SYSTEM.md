# Auth System

## Backend Auth Routes

Mounted under:

- `/auth/*`
- `/api/v1/auth/*`

Implemented endpoints:

- `POST /register`
- `POST /login`
- `POST /forgot-password`
- `POST /reset-password`
- `POST /refresh`
- `GET /me`

## Token Model

- Access token: JWT, expires in `15m`
- Refresh token: JWT, expires in `30d`
- Legacy compatibility field `token` still returned as alias of access token

## Password Handling

- Hashing: `scrypt` (`backend/src/auth/PasswordHasher.ts`)
- Reset flow:
  - random token generated
  - hashed via SHA-256
  - stored in `password_reset_tokens`
  - API returns `{ status: "ok" }` for forgot-password to avoid account enumeration

## Validation and Error Language

- Zod validation in auth routes
- Russian messages for key auth failures, including:
  - missing login fields
  - unknown user
  - invalid password
  - invalid/expired reset link

## Frontend Auth Integration

- `AuthService` uses `/auth` routes
- `AuthContext` fetches current user with `/auth/me`
- `ProtectedRoute` blocks private routes when token missing
- Login redirects to `/dashboard`
- Logout clears local token(s) and navigates to `/login`

## Admin Bootstrap

- Script: `backend/scripts/create-admin.ts`
- Reads credentials from environment (`ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME`)
- No hardcoded admin credentials in script source

