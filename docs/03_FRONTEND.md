# Frontend

## Location

- Source: `src`
- Router root: `src/App.tsx`

## Routing Model

Public routes:

- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`

Protected routes:

- all application pages (dashboard, studios, assistants, settings, etc.)
- protected via `src/components/auth/ProtectedRoute.tsx`

## Auth State

- Provider: `src/contexts/AuthContext.tsx`
- On app startup:
  - reads token from localStorage via `AuthService`
  - calls `GET /auth/me`
  - stores user in context
- Exposes:
  - `user`
  - `loading`
  - `setSessionFromLogin()`
  - `refreshUser()`
  - `logout()`

## Login and Redirect

From `src/pages/Login.tsx`:

- Calls `authService.login()`
- Stores session through `setSessionFromLogin(result)`
- Redirects to `/dashboard`

## Sidebar User Panel

- Component: `src/components/layout/SidebarUser.tsx`
- Integrated in `src/components/layout/AppSidebar.tsx`
- Displays:
  - user avatar initials
  - user name
  - user email
  - role badge
- Actions:
  - Profile -> `/profile`
  - Logout -> clear token(s), navigate `/login`

## Auth Service

File: `src/services/AuthService.ts`

- Base path: `/auth`
- token keys:
  - `token` (primary)
  - `ai_gateway_token` (legacy compatibility)
- methods:
  - `register`, `login`, `forgotPassword`, `resetPassword`, `me`, `logout`

## Assistant/Media Frontend

Project contains service/controller architecture for AI pages:

- services: `AssistantService`, `VisionService`, `VoiceService`, `CameraService`
- controllers: `src/controllers/**`
- pages:
  - `AIStudio`
  - `VideoAssistant`
  - `VoiceAssistant`
  - `LiveAIMode`
  - `MultimodalChat`
  - `SystemTest`

Feature completeness varies by page; most critical auth/dashboard UX flow is implemented and deployed.

