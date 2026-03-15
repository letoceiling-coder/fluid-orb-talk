export interface CameraOptions {
  width?: number;
  height?: number;
  facingMode?: 'user' | 'environment';
}

export class CameraService {
  private static instance: CameraService;
  private stream: MediaStream | null = null;
  private videoElement: HTMLVideoElement | null = null;

  static getInstance(): CameraService {
    if (!CameraService.instance) CameraService.instance = new CameraService();
    return CameraService.instance;
  }

  async startCamera(
    videoEl: HTMLVideoElement,
    options: CameraOptions = {}
  ): Promise<MediaStream> {
    if (this.stream) this.stopCamera();

    const { width = 1280, height = 720, facingMode = 'user' } = options;

    this.stream = await navigator.mediaDevices.getUserMedia({
      video: { width, height, facingMode },
      audio: false,
    });

    this.videoElement = videoEl;
    videoEl.srcObject = this.stream;
    await videoEl.play().catch(() => undefined);

    return this.stream;
  }

  stopCamera(): void {
    this.stream?.getTracks().forEach((t) => t.stop());
    this.stream = null;
    if (this.videoElement) {
      this.videoElement.srcObject = null;
      this.videoElement = null;
    }
  }

  captureFrame(
    options: { width?: number; height?: number; quality?: number } = {}
  ): string | null {
    const video = this.videoElement;
    if (!video || !video.videoWidth) return null;

    const { width = 640, height = 360, quality = 0.85 } = options;
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, width, height);
    return canvas.toDataURL('image/jpeg', quality);
  }

  captureFrameToCanvas(canvas: HTMLCanvasElement): string | null {
    const video = this.videoElement;
    if (!video || !video.videoWidth) return null;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.85);
  }

  get active(): boolean {
    return this.stream !== null && this.stream.active;
  }

  get currentStream(): MediaStream | null {
    return this.stream;
  }
}

export const cameraService = CameraService.getInstance();
