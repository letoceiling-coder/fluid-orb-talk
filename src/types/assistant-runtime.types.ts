export type AssistantType =
  | 'ai_studio'
  | 'video_assistant'
  | 'voice_assistant'
  | 'live_ai'
  | 'multimodal_chat';

export type RuntimeState =
  | 'INIT'
  | 'IDLE'
  | 'COMPOSING'
  | 'SENDING_HTTP'
  | 'SENDING_WS'
  | 'STREAMING'
  | 'RECEIVED'
  | 'RESETTING'
  | 'CAMERA_REQUESTING'
  | 'CAMERA_READY'
  | 'CAMERA_ERROR'
  | 'FRAME_CAPTURING'
  | 'VISION_ANALYZING'
  | 'VISION_READY'
  | 'VISION_ERROR'
  | 'STOPPED'
  | 'LISTENING'
  | 'TRANSCRIBING'
  | 'CHAT_PENDING'
  | 'TTS_PENDING'
  | 'SPEAKING'
  | 'SESSION_STARTING'
  | 'MIC_READY'
  | 'VISION_SAMPLING'
  | 'CHAT_STREAMING'
  | 'TTS_SPEAKING'
  | 'SESSION_PAUSED'
  | 'SESSION_ERROR'
  | 'SESSION_STOPPED'
  | 'ATTACHING'
  | 'UPLOADING'
  | 'PREPROCESSING'
  | 'READY_TO_SEND'
  | 'RENDERING_RESULT'
  | 'ERROR';

export interface AssistantSession {
  session_id: string;
  assistant_type: AssistantType;
  state: RuntimeState;
  created_at: string;
  updated_at: string;
  ended_at?: string;
  active: boolean;
  metadata?: Record<string, unknown>;
}

export interface StateTransition {
  session_id: string;
  assistant_type: AssistantType;
  from: RuntimeState;
  to: RuntimeState;
  timestamp: string;
  reason?: string;
}

export interface StateMachineDefinition {
  assistant_type: AssistantType;
  initial_state: RuntimeState;
  allowed_transitions: Partial<Record<RuntimeState, RuntimeState[]>>;
}

export interface MediaState {
  camera_active: boolean;
  mic_active: boolean;
  camera_permission_denied: boolean;
  mic_permission_denied: boolean;
  facing_mode: 'user' | 'environment';
  last_error?: string;
}

