import { mediaController, type MediaController } from '@/controllers/runtime/MediaController';
import {
  assistantStateController,
  type AssistantStateController,
} from '@/controllers/runtime/AssistantStateController';
import { sessionController, type SessionController } from '@/controllers/runtime/SessionController';
import type { AssistantSession, RuntimeState } from '@/types/assistant-runtime.types';
import { visionService, type VisionResponse } from '@/services/VisionService';

export interface VideoAssistantTelemetryEvent {
  session_id: string;
  assistant_type: 'video_assistant';
  state?: RuntimeState;
  error: string;
  timestamp: string;
}

export interface VideoAssistantCallbacks {
  onVisionResult?: (result: VisionResponse) => void;
  onStateChange?: (state: RuntimeState) => void;
  onError?: (error: string, state: 'CAMERA_ERROR' | 'VISION_ERROR') => void;
  onTelemetry?: (event: VideoAssistantTelemetryEvent) => void;
}

export interface VideoCaptureResult {
  frame: string;
  result: VisionResponse;
}

export class VideoAssistantController {
  private session: AssistantSession | null = null;
  private callbacks: VideoAssistantCallbacks;
  private autoScanTimer: ReturnType<typeof setInterval> | null = null;
  private scanInFlight = false;

  constructor(
    callbacks: VideoAssistantCallbacks = {},
    private readonly media: MediaController = mediaController,
    private readonly states: AssistantStateController = assistantStateController,
    private readonly sessions: SessionController = sessionController,
  ) {
    this.callbacks = callbacks;
  }

  setCallbacks(callbacks: VideoAssistantCallbacks): void {
    this.callbacks = callbacks;
  }

  initialize(video: HTMLVideoElement): Promise<AssistantSession> {
    if (!this.session) {
      this.session = this.sessions.createSession('video_assistant');
      this.states.initializeState(this.session);
    }

    this.transition('CAMERA_REQUESTING', 'initialize camera');

    return this.media
      .startCamera(video)
      .then(() => {
        this.transition('CAMERA_READY', 'camera ready');
        return this.session as AssistantSession;
      })
      .catch((err) => {
        this.handleError(err, 'CAMERA_ERROR');
        throw err;
      });
  }

  async captureFrame(prompt?: string): Promise<VideoCaptureResult> {
    this.ensureSession();
    this.ensureCaptureReady();

    this.transition('FRAME_CAPTURING', 'capture frame');
    const frame = this.media.captureFrame({ width: 640, height: 360, quality: 0.85 });
    if (!frame) {
      const err = new Error('Failed to capture frame');
      this.handleError(err, 'VISION_ERROR');
      throw err;
    }

    this.transition('VISION_ANALYZING', 'analyze captured frame');

    try {
      const result = await visionService.analyzeImage(frame, prompt);
      this.handleVisionResult(result);
      return { frame, result };
    } catch (err) {
      this.handleError(err, 'VISION_ERROR');
      throw err;
    }
  }

  handleVisionResult(result: VisionResponse): void {
    this.transition('VISION_READY', 'vision result received');
    this.callbacks.onVisionResult?.(result);
  }

  startAutoScan(intervalMs: number, prompt?: string): void {
    this.stopAutoScan();
    this.autoScanTimer = setInterval(() => {
      if (this.scanInFlight) return;
      this.scanInFlight = true;
      this.captureFrame(prompt).catch(() => undefined).finally(() => {
        this.scanInFlight = false;
      });
    }, intervalMs);
  }

  stopAutoScan(): void {
    if (!this.autoScanTimer) return;
    clearInterval(this.autoScanTimer);
    this.autoScanTimer = null;
    this.scanInFlight = false;
  }

  async switchCamera(video: HTMLVideoElement): Promise<void> {
    this.ensureSession();
    this.transition('CAMERA_REQUESTING', 'switch camera');
    try {
      await this.media.switchCamera(video);
      this.transition('CAMERA_READY', 'switched camera');
    } catch (err) {
      this.handleError(err, 'CAMERA_ERROR');
      throw err;
    }
  }

  stopCamera(): void {
    this.stopAutoScan();
    this.media.stopCamera();
    this.transition('STOPPED', 'camera stopped');
  }

  handleError(error: unknown, targetState: 'CAMERA_ERROR' | 'VISION_ERROR' = 'CAMERA_ERROR'): void {
    const message = error instanceof Error ? error.message : String(error);
    this.transition(targetState, message);
    this.callbacks.onError?.(message, targetState);
    this.emitTelemetry(message, targetState);
  }

  getSession(): AssistantSession | null {
    return this.session;
  }

  private ensureSession(): void {
    if (!this.session) {
      throw new Error('[VideoAssistantController] Session not initialized');
    }
  }

  private ensureCaptureReady(): void {
    const state = this.currentState();
    if (state === 'VISION_READY') {
      this.transition('CAMERA_READY', 'prepare next capture');
      return;
    }
    if (state !== 'CAMERA_READY') {
      throw new Error(`Cannot capture frame in state ${state}`);
    }
  }

  private currentState(): RuntimeState | null {
    if (!this.session) return null;
    return this.states.getState(this.session.session_id);
  }

  private transition(next: RuntimeState, reason?: string): void {
    if (!this.session) return;
    try {
      this.states.transition(this.session.session_id, next, reason);
      this.callbacks.onStateChange?.(next);
    } catch (err) {
      console.error('[VideoAssistantController] transition rejected', {
        session_id: this.session.session_id,
        next,
        reason,
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  }

  private emitTelemetry(error: string, state: 'CAMERA_ERROR' | 'VISION_ERROR'): void {
    if (!this.session) return;
    const payload: VideoAssistantTelemetryEvent = {
      session_id: this.session.session_id,
      assistant_type: 'video_assistant',
      state,
      error,
      timestamp: new Date().toISOString(),
    };
    this.callbacks.onTelemetry?.(payload);
    console.error('[VideoAssistantController] telemetry.error', payload);
  }
}

