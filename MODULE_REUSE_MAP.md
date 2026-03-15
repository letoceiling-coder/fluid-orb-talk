# Module Reuse Map — gaze-speak-ai → fluid-orb-talk

This document maps every reusable module from `gaze-speak-ai` (R&D project) to the target pages and components in `fluid-orb-talk` (main project).

---

## Summary Table

| Source (gaze-speak-ai) | Type | Target pages in fluid-orb-talk | Priority | Notes |
|------------------------|------|-------------------------------|----------|-------|
| `src/services/VoiceService.ts` | Service | VoiceAssistantPage, VoiceStudio, AIStudio, LiveAIMode | HIGH | Web Speech API STT + TTS — replaces all inline mock voice logic |
| `src/services/CameraService.ts` | Service | LiveAIMode, VideoAssistant | HIGH | MediaDevices API — replaces 60+ lines of inline stream code |
| `src/services/VisionService.ts` | Service | LiveAIMode, MultimodalChat, VideoAssistant | HIGH | Interface only; implementation must call real backend endpoint |
| `src/services/AssistantService.ts` | Service | AIStudio, MultimodalChat, LiveAIMode | MEDIUM | Conversation history + session management |
| `src/hooks/useVoice.ts` | Hook | VoiceAssistantPage, VoiceStudio, LiveAIMode | HIGH | React state wrapper for VoiceService |
| `src/hooks/useCamera.ts` | Hook | LiveAIMode, VideoAssistant | HIGH | React state wrapper for CameraService |
| `src/hooks/useThemeToggle.tsx` | Hook | Settings | LOW | Persistent dark/light theme via localStorage |
| `src/components/assistant/ChatPanel.tsx` | Component | AIStudio, MultimodalChat | MEDIUM | Full conversation panel with history, speak, regenerate |
| `src/components/assistant/ChatInput.tsx` | Component | AIStudio, MultimodalChat | MEDIUM | Text input + mic toggle |
| `src/components/assistant/StatusIndicator.tsx` | Component | LiveAIMode, VoiceAssistantPage | MEDIUM | Shows: standby / listening / processing / responding |
| `src/components/assistant/ActivationButton.tsx` | Component | LiveAIMode | LOW | Animated start/stop button |
| `src/components/assistant/ResponseCard.tsx` | Component | AIStudio, MultimodalChat | LOW | Individual message bubble with snapshot support |
| `src/components/assistant/ThinkingIndicator.tsx` | Component | AIStudio, MultimodalChat, LiveAIMode | LOW | Animated "thinking" dots |
| `src/components/assistant/SuggestedQuestions.tsx` | Component | AIStudio | LOW | Quick-start prompt chips |
| `src/components/vision/CameraOverlay.tsx` | Component | LiveAIMode | MEDIUM | HUD overlay with scan animation during analysis |
| `src/components/vision/ControlPanel.tsx` | Component | LiveAIMode | LOW | Camera controls: switch, capture, pause, reset |
| `src/components/voice/VoiceWaveform.tsx` | Component | VoiceAssistantPage, VoiceStudio | MEDIUM | Animated waveform bars (already used in fluid-orb-talk mock) |
| `src/pages/AdminDashboard.tsx` | Page pattern | ApiKeys, Settings | LOW | Config pattern: API key fields, rate limits, endpoint URLs, logging toggle |

---

## Detailed Module Descriptions

### VoiceService (`src/services/VoiceService.ts`)

**What it does:**
- `startListening(onResult, onEnd)` — uses `window.SpeechRecognition` / `webkitSpeechRecognition`, falls back to simulation
- `stopListening()` — cancels ongoing recognition
- `speak(text, onEnd)` — uses `window.speechSynthesis`, selects preferred voice by gender
- `stopSpeaking()` — cancels TTS
- Configurable: `lang`, `rate`, `pitch`, `voiceGender`

**Target pages:**
- `VoiceAssistantPage` — replaces `cannedResponses` simulation and fake waveform trigger
- `VoiceStudio` — enables real STT/TTS preview
- `AIStudio` — mic button becomes functional
- `LiveAIMode` — replaces inline SpeechRecognition code

**Migration note:** The service is a singleton (`voiceService`). Import and use directly; no constructor args needed.

---

### CameraService (`src/services/CameraService.ts`)

**What it does:**
- `start(videoEl)` — requests `getUserMedia`, attaches stream to `<video>`
- `stop()` — stops all tracks, clears reference
- `switchCamera()` — toggles `facingMode` between user/environment
- `captureFrame()` — draws current frame to canvas, returns base64 JPEG at 0.8 quality
- `isActive` getter — boolean stream status

**Target pages:**
- `LiveAIMode` — has 50+ lines of inline camera code (`useRef<MediaStream>`, `getUserMedia`, manual cleanup). Replace entirely.
- `VideoAssistant` — same pattern, same replacement.

**Migration note:** `captureFrame()` returns `string | null`. The returned base64 string is the frame to send to VisionService or backend `/api/v1/vision`.

---

### VisionService (`src/services/VisionService.ts`)

**Current state:** Returns mock contextual responses based on keyword matching in the prompt.

**Interface to preserve:**
```typescript
analyzeFrame(frameData: string, prompt?: string): Promise<string>
```

**What changes in migration:**
Replace the mock implementation body with a real fetch to backend:
```typescript
analyzeFrame(frameData: string, prompt?: string): Promise<string> {
  return fetch('/api/v1/vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify({ frame: frameData, prompt })
  }).then(r => r.json()).then(d => d.response);
}
```

**Target pages:** `LiveAIMode`, `MultimodalChat`, `VideoAssistant`

---

### AssistantService (`src/services/AssistantService.ts`)

**What it does:**
- Maintains `ConversationMessage[]` array with id, role, content, timestamp, frameSnapshot
- `addMessage(role, content, frameSnapshot?)` — appends message, returns it
- `clearHistory()` — reset session
- `getLastAssistantMessage()` — for regeneration

**Target pages:**
- `AIStudio` — currently has no conversation history service; all state is local
- `MultimodalChat` — same situation

**Migration note:** The singleton pattern means history persists across route changes. For per-session isolation, instantiate a new `AssistantService()` per component instead of using the exported singleton.

---

### useVoice (`src/hooks/useVoice.ts`)

**Exposes:** `{ isListening, isSpeaking, transcript, startListening, stopListening, speak, stopSpeaking }`

**Target pages:**
- `VoiceAssistantPage` — replace manual `setInterval` simulation with real hook
- `VoiceStudio` — enable live preview
- `LiveAIMode` — inline recognition code becomes `const { startListening, stopListening } = useVoice()`

---

### useCamera (`src/hooks/useCamera.ts`)

**Exposes:** `{ videoRef, isActive, error, start, stop, switchCamera, captureFrame }`

**Target pages:**
- `LiveAIMode` — `videoRef = useRef<HTMLVideoElement>()` + 40 lines of effect code become single hook call
- `VideoAssistant` — same

---

### CameraOverlay (`src/components/vision/CameraOverlay.tsx`)

**What it does:** Renders a HUD overlay on the `<video>` element. Shows scan-line animation when `isAnalyzing=true`, status ring when `isActive=true`.

**Props:** `{ isActive: boolean, isAnalyzing: boolean }`

**Target:** `LiveAIMode` — currently has no visual feedback overlay during frame analysis.

---

### VoiceWaveform (`src/components/voice/VoiceWaveform.tsx`)

**What it does:** Animates bars of varying height to represent audio activity.

**Props:** `{ isActive: boolean }`

**Target:**
- `VoiceAssistantPage` — already has `waveformData` state + manual `setInterval`. Replace with component.
- `VoiceStudio` — same.

---

### ChatPanel + ChatInput (`src/components/assistant/`)

**ChatPanel props:** `{ messages, isThinking, isSpeaking, isOpen, onClose, onSpeak, onStopSpeaking, onRegenerate, onClear }`

**ChatInput props:** `{ onSend, onMicToggle, isListening, disabled }`

**Target:**
- `AIStudio` — currently renders messages inline; replace with ChatPanel for consistent UX
- `MultimodalChat` — same

---

### StatusIndicator (`src/components/assistant/StatusIndicator.tsx`)

**Props:** `{ state: "standby" | "watching" | "listening" | "processing" | "responding" }`

Shows colored dot + label indicating current assistant state.

**Target:**
- `LiveAIMode` — no status indicator currently
- `VoiceAssistantPage` — shows `orbState` text; replace with component

---

## What Is NOT Reused

| Module | Reason |
|--------|--------|
| `src/pages/AdminLogin.tsx` | sessionStorage-based auth is not secure enough for production. Use JWT-based auth from backend instead. |
| Mock responses in `VisionService.ts` | Must be replaced with real backend call during Phase 2 migration. |
| `src/App.tsx` from gaze-speak-ai | Routing structure is entirely different (no sidebar layout). |
| `src/pages/Index.tsx` from gaze-speak-ai | The orchestration pattern (Camera→STT→Vision→TTS state machine) is a reference implementation, not a direct copy. Adapt it into `LiveAIMode`. |
| `src/test/` | Tests are specific to gaze-speak-ai pages and services. Write new tests in fluid-orb-talk context. |
