import type { AssistantSession, AssistantType, RuntimeState } from '@/types/assistant-runtime.types';

function nowIso(): string {
  return new Date().toISOString();
}

function makeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `session_${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

export interface SessionCreateOptions {
  session_id?: string;
  initial_state?: RuntimeState;
  metadata?: Record<string, unknown>;
}

export class SessionController {
  private sessions = new Map<string, AssistantSession>();

  createSession(assistant_type: AssistantType, options: SessionCreateOptions = {}): AssistantSession {
    const timestamp = nowIso();
    const session: AssistantSession = {
      session_id: options.session_id ?? makeId(),
      assistant_type,
      state: options.initial_state ?? 'INIT',
      created_at: timestamp,
      updated_at: timestamp,
      active: true,
      metadata: options.metadata,
    };

    this.sessions.set(session.session_id, session);
    return session;
  }

  getSession(session_id: string): AssistantSession | null {
    return this.sessions.get(session_id) ?? null;
  }

  endSession(session_id: string): boolean {
    const session = this.sessions.get(session_id);
    if (!session) return false;

    const timestamp = nowIso();
    this.sessions.set(session_id, {
      ...session,
      active: false,
      ended_at: timestamp,
      updated_at: timestamp,
    });
    return true;
  }

  setState(session_id: string, state: RuntimeState): void {
    const session = this.sessions.get(session_id);
    if (!session) return;
    this.sessions.set(session_id, {
      ...session,
      state,
      updated_at: nowIso(),
    });
  }

  /**
   * Ensures payload carries session_id for assistant requests.
   */
  propagateSessionId<T extends Record<string, unknown>>(session_id: string, payload: T): T & { session_id: string } {
    return {
      ...payload,
      session_id,
    };
  }
}

export const sessionController = new SessionController();

