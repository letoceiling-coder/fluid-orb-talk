import { assistantService, type ChatMessage } from '@/services/AssistantService';
import { voiceService, type TextToSpeechOptions } from '@/services/VoiceService';
import { sessionController, type SessionController } from '@/controllers/runtime/SessionController';
import { assistantStateController, type AssistantStateController } from '@/controllers/runtime/AssistantStateController';
import type { AssistantSession } from '@/types/assistant-runtime.types';

export type VoiceControllerState =
  | 'INIT'
  | 'MIC_REQUESTING'
  | 'LISTENING'
  | 'PROCESSING'
  | 'AI_RESPONSE'
  | 'SPEAKING'
  | 'IDLE'
  | 'VOICE_ERROR';

export interface VoiceAssistantCallbacks {
  onStateChange?: (state: VoiceControllerState) => void;
  onTranscript?: (text: string, final: boolean) => void;
  onResponse?: (text: string) => void;
  onError?: (message: string) => void;
  onTelemetry?: (event: {
    session_id: string;
    assistant_type: 'voice_assistant';
    state: VoiceControllerState;
    error: string;
    timestamp: string;
  }) => void;
}

export interface StartListeningOptions {
  voice?: string;
  language?: string;
}

export class VoiceAssistantController {
  private session: AssistantSession | null = null;
  private callbacks: VoiceAssistantCallbacks;
  private state: VoiceControllerState = 'INIT';
  private history: Array<{ role: 'user' | 'assistant'; text: string }> = [];
  private currentVoice = 'rachel';
  private currentLanguage = 'ru';

  constructor(
    callbacks: VoiceAssistantCallbacks = {},
    private readonly sessions: SessionController = sessionController,
    private readonly states: AssistantStateController = assistantStateController,
  ) {
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: VoiceAssistantCallbacks): void {
    this.callbacks = callbacks;
  }

  initialize(session_id?: string): AssistantSession {
    const existing = session_id ? this.sessions.getSession(session_id) : null;
    this.session = existing ?? this.sessions.createSession('voice_assistant', { session_id });

    if (this.session.state === 'INIT') {
      this.states.transition(this.session.session_id, 'IDLE', 'initialize');
    }

    this.setLocalState('IDLE');
    return this.session;
  }

  getSession(): AssistantSession | null {
    return this.session;
  }

  getHistory(): Array<{ role: 'user' | 'assistant'; text: string }> {
    return [...this.history];
  }

  startListening(options: StartListeningOptions = {}): void {
    this.ensureSession();
    if (this.state === 'LISTENING' || this.state === 'MIC_REQUESTING') return;

    this.currentVoice = options.voice ?? this.currentVoice;
    this.currentLanguage = options.language ?? this.currentLanguage;

    this.setLocalState('MIC_REQUESTING');

    try {
      this.states.transition(this.session!.session_id, 'LISTENING', 'start mic');
      this.setLocalState('LISTENING');
      voiceService.startMic({
        language: this.currentLanguage.toLowerCase().startsWith('ru') ? 'ru-RU' : this.currentLanguage,
        onInterim: (text) => this.callbacks.onTranscript?.(text, false),
        onFinal: (text) => {
          this.callbacks.onTranscript?.(text, true);
          void this.processSpeech(text);
        },
        onError: (error) => this.handleError(error),
      });
    } catch (err) {
      this.handleError(err instanceof Error ? err.message : String(err));
    }
  }

  stopListening(): void {
    voiceService.stopMic();
    if (!this.session) {
      this.setLocalState('IDLE');
      return;
    }
    try {
      this.states.transition(this.session.session_id, 'IDLE', 'stop mic');
    } catch {
      // keep local state consistent even if runtime transition is not available
    }
    this.setLocalState('IDLE');
  }

  async processSpeech(transcript: string): Promise<void> {
    this.ensureSession();
    const text = transcript.trim();
    if (!text) return;

    voiceService.stopMic();
    this.setLocalState('PROCESSING');

    try {
      this.states.transition(this.session!.session_id, 'TRANSCRIBING', 'final transcript captured');
      this.states.transition(this.session!.session_id, 'CHAT_PENDING', 'send chat request');

      this.history.push({ role: 'user', text });

      const messages: ChatMessage[] = this.history.map((item) => ({
        role: item.role,
        content: item.text,
      }));

      const result = await assistantService.sendMessage(messages);
      const reply = result.message;

      this.history.push({ role: 'assistant', text: reply });
      this.setLocalState('AI_RESPONSE');
      this.callbacks.onResponse?.(reply);

      await this.speakResponse(reply, {
        voice: this.currentVoice,
        language: this.currentLanguage,
      });

      this.states.transition(this.session!.session_id, 'IDLE', 'voice cycle complete');
      this.setLocalState('IDLE');
    } catch (err) {
      this.handleError(err instanceof Error ? err.message : String(err));
      throw err;
    }
  }

  async speakResponse(text: string, options: TextToSpeechOptions = {}): Promise<void> {
    this.ensureSession();
    this.states.transition(this.session!.session_id, 'TTS_PENDING', 'prepare tts');
    this.states.transition(this.session!.session_id, 'SPEAKING', 'speak response');
    this.setLocalState('SPEAKING');

    const audio = await voiceService.textToSpeech(text, {
      voice: options.voice ?? this.currentVoice,
      language: options.language ?? this.currentLanguage,
    });
    await voiceService.playAudio(audio);
  }

  handleError(error: string): void {
    this.ensureSession();
    try {
      this.states.transition(this.session!.session_id, 'ERROR', error);
    } catch {
      // no-op
    }
    this.setLocalState('VOICE_ERROR');
    this.callbacks.onError?.(error);
    this.callbacks.onTelemetry?.({
      session_id: this.session!.session_id,
      assistant_type: 'voice_assistant',
      state: 'VOICE_ERROR',
      error,
      timestamp: new Date().toISOString(),
    });
  }

  destroy(): void {
    voiceService.cancel();
  }

  private ensureSession(): void {
    if (!this.session) this.initialize();
  }

  private setLocalState(state: VoiceControllerState): void {
    this.state = state;
    this.callbacks.onStateChange?.(state);
  }
}

