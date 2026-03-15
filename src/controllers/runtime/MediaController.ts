import { cameraService, type CameraOptions } from '@/services/CameraService';
import { voiceService } from '@/services/VoiceService';
import type { MediaState } from '@/types/assistant-runtime.types';

export interface MicCallbacks {
  onInterim?: (text: string) => void;
  onFinal?: (text: string) => void;
  onError?: (error: string) => void;
}

export class MediaController {
  private state: MediaState = {
    camera_active: false,
    mic_active: false,
    camera_permission_denied: false,
    mic_permission_denied: false,
    facing_mode: 'user',
  };

  async startCamera(video: HTMLVideoElement, options: CameraOptions = {}): Promise<MediaStream> {
    const facing_mode = options.facingMode ?? this.state.facing_mode;
    this.state.facing_mode = facing_mode;
    this.state.last_error = undefined;
    this.state.camera_permission_denied = false;

    try {
      const stream = await cameraService.startCamera(video, {
        ...options,
        facingMode: facing_mode,
      });
      this.state.camera_active = true;
      return stream;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Camera unavailable';
      this.state.camera_active = false;
      this.state.last_error = msg;
      this.state.camera_permission_denied = this.isPermissionError(msg);
      throw err;
    }
  }

  stopCamera(): void {
    cameraService.stopCamera();
    this.state.camera_active = false;
  }

  async switchCamera(video: HTMLVideoElement): Promise<MediaStream> {
    const next = this.state.facing_mode === 'user' ? 'environment' : 'user';
    this.stopCamera();
    return this.startCamera(video, { facingMode: next });
  }

  startMic(callbacks: MicCallbacks = {}): void {
    this.state.last_error = undefined;
    this.state.mic_permission_denied = false;

    if (!voiceService.supported) {
      const msg = 'Speech recognition is not supported in this browser';
      this.state.last_error = msg;
      callbacks.onError?.(msg);
      return;
    }

    this.state.mic_active = true;
    voiceService.startListening(
      (interim) => callbacks.onInterim?.(interim),
      (final) => callbacks.onFinal?.(final),
      (error) => {
        this.state.mic_active = false;
        this.state.last_error = error;
        this.state.mic_permission_denied = this.isPermissionError(error);
        callbacks.onError?.(error);
      },
    );
  }

  stopMic(): void {
    voiceService.stopListening();
    this.state.mic_active = false;
  }

  stopAll(): void {
    this.stopMic();
    this.stopCamera();
  }

  captureFrame(options?: { width?: number; height?: number; quality?: number }): string | null {
    return cameraService.captureFrame(options);
  }

  getState(): MediaState {
    return { ...this.state };
  }

  private isPermissionError(message: string): boolean {
    const lower = message.toLowerCase();
    return lower.includes('permission') || lower.includes('denied') || lower.includes('notallowederror');
  }
}

export const mediaController = new MediaController();

