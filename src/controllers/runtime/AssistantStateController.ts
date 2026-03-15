import type {
  AssistantSession,
  AssistantType,
  RuntimeState,
  StateMachineDefinition,
  StateTransition,
} from '@/types/assistant-runtime.types';
import { sessionController, type SessionController } from './SessionController';

function ts(): string {
  return new Date().toISOString();
}

const DEFAULT_MACHINES: Record<AssistantType, StateMachineDefinition> = {
  ai_studio: {
    assistant_type: 'ai_studio',
    initial_state: 'INIT',
    allowed_transitions: {
      INIT: ['IDLE'],
      IDLE: ['COMPOSING', 'RESETTING'],
      COMPOSING: ['SENDING_HTTP', 'SENDING_WS', 'IDLE'],
      SENDING_HTTP: ['RECEIVED', 'ERROR'],
      SENDING_WS: ['STREAMING', 'ERROR'],
      STREAMING: ['RECEIVED', 'ERROR'],
      RECEIVED: ['IDLE', 'COMPOSING'],
      RESETTING: ['IDLE'],
      ERROR: ['IDLE', 'COMPOSING'],
    },
  },
  video_assistant: {
    assistant_type: 'video_assistant',
    initial_state: 'INIT',
    allowed_transitions: {
      INIT: ['CAMERA_REQUESTING'],
      CAMERA_REQUESTING: ['CAMERA_READY', 'CAMERA_ERROR'],
      CAMERA_READY: ['FRAME_CAPTURING', 'STOPPED'],
      FRAME_CAPTURING: ['VISION_ANALYZING', 'VISION_ERROR'],
      VISION_ANALYZING: ['VISION_READY', 'VISION_ERROR'],
      VISION_READY: ['CAMERA_READY'],
      VISION_ERROR: ['CAMERA_READY', 'CAMERA_REQUESTING'],
      CAMERA_ERROR: ['CAMERA_REQUESTING', 'STOPPED'],
      STOPPED: ['CAMERA_REQUESTING'],
    },
  },
  voice_assistant: {
    assistant_type: 'voice_assistant',
    initial_state: 'INIT',
    allowed_transitions: {
      INIT: ['IDLE'],
      IDLE: ['LISTENING'],
      LISTENING: ['TRANSCRIBING', 'IDLE', 'ERROR'],
      TRANSCRIBING: ['CHAT_PENDING', 'ERROR'],
      CHAT_PENDING: ['TTS_PENDING', 'ERROR'],
      TTS_PENDING: ['SPEAKING', 'ERROR'],
      SPEAKING: ['IDLE', 'ERROR'],
      ERROR: ['IDLE'],
    },
  },
  live_ai: {
    assistant_type: 'live_ai',
    initial_state: 'INIT',
    allowed_transitions: {
      INIT: ['IDLE'],
      IDLE: ['SESSION_STARTING'],
      SESSION_STARTING: ['CAMERA_READY', 'MIC_READY', 'SESSION_ERROR'],
      CAMERA_READY: ['LISTENING', 'SESSION_STOPPED'],
      MIC_READY: ['LISTENING', 'SESSION_STOPPED'],
      LISTENING: ['VISION_SAMPLING', 'CHAT_STREAMING', 'SESSION_PAUSED', 'SESSION_STOPPED', 'SESSION_ERROR'],
      VISION_SAMPLING: ['CHAT_STREAMING', 'SESSION_ERROR'],
      CHAT_STREAMING: ['TTS_SPEAKING', 'SESSION_ERROR'],
      TTS_SPEAKING: ['LISTENING', 'SESSION_PAUSED', 'SESSION_STOPPED'],
      SESSION_PAUSED: ['LISTENING', 'SESSION_STOPPED'],
      SESSION_ERROR: ['SESSION_STARTING', 'SESSION_STOPPED'],
      SESSION_STOPPED: ['SESSION_STARTING', 'IDLE'],
    },
  },
  multimodal_chat: {
    assistant_type: 'multimodal_chat',
    initial_state: 'INIT',
    allowed_transitions: {
      INIT: ['IDLE'],
      IDLE: ['COMPOSING'],
      COMPOSING: ['ATTACHING', 'READY_TO_SEND', 'IDLE'],
      ATTACHING: ['UPLOADING', 'COMPOSING', 'ERROR'],
      UPLOADING: ['PREPROCESSING', 'ERROR'],
      PREPROCESSING: ['READY_TO_SEND', 'ERROR'],
      READY_TO_SEND: ['CHAT_PENDING', 'COMPOSING'],
      CHAT_PENDING: ['STREAMING', 'RENDERING_RESULT', 'ERROR'],
      STREAMING: ['RENDERING_RESULT', 'ERROR'],
      RENDERING_RESULT: ['COMPOSING', 'IDLE'],
      ERROR: ['COMPOSING', 'IDLE'],
    },
  },
};

export class AssistantStateController {
  private machines = new Map<AssistantType, StateMachineDefinition>();
  private transitions: StateTransition[] = [];

  constructor(private readonly sessions: SessionController = sessionController) {
    (Object.keys(DEFAULT_MACHINES) as AssistantType[]).forEach((k) => {
      this.machines.set(k, DEFAULT_MACHINES[k]);
    });
  }

  registerMachine(definition: StateMachineDefinition): void {
    this.machines.set(definition.assistant_type, definition);
  }

  initializeState(session: AssistantSession): void {
    const machine = this.machines.get(session.assistant_type);
    const initial = machine?.initial_state ?? 'INIT';
    this.sessions.setState(session.session_id, initial);
  }

  getState(session_id: string): RuntimeState | null {
    return this.sessions.getSession(session_id)?.state ?? null;
  }

  transition(session_id: string, next: RuntimeState, reason?: string): StateTransition {
    const session = this.sessions.getSession(session_id);
    if (!session) {
      throw new Error(`[AssistantStateController] Session not found: ${session_id}`);
    }

    const machine = this.machines.get(session.assistant_type);
    if (!machine) {
      throw new Error(`[AssistantStateController] State machine not registered: ${session.assistant_type}`);
    }

    const current = session.state;
    const allowed = machine.allowed_transitions[current] ?? [];
    if (!allowed.includes(next)) {
      console.error('[AssistantStateController] Invalid transition rejected', {
        session_id,
        assistant_type: session.assistant_type,
        from: current,
        to: next,
        allowed,
      });
      throw new Error(`Invalid transition: ${current} -> ${next} for ${session.assistant_type}`);
    }

    const record: StateTransition = {
      session_id,
      assistant_type: session.assistant_type,
      from: current,
      to: next,
      timestamp: ts(),
      reason,
    };

    this.sessions.setState(session_id, next);
    this.transitions.push(record);

    console.log('[AssistantStateController] Transition', record);
    return record;
  }

  getTransitionLog(session_id?: string): StateTransition[] {
    if (!session_id) return [...this.transitions];
    return this.transitions.filter((t) => t.session_id === session_id);
  }
}

export const assistantStateController = new AssistantStateController();

