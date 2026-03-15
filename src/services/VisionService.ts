const GATEWAY_BASE = '/gateway';

const DEFAULT_PROMPT = `
Ты — AI система компьютерного зрения.

Опиши общую сцену на изображении.

Сфокусируйся на:
- окружении
- объектах
- освещении
- действиях

НЕ пытайся идентифицировать личности людей.

ВАЖНО:
Отвечай только на русском языке.
Никогда не отвечай на английском.
Все ответы должны быть исключительно на русском языке.
`.trim();

export interface VisionResponse {
  description: string;
  confidence?: number;
  objects?: string[];
  text?: string;
}

export class VisionService {
  private static instance: VisionService;
  static getInstance(): VisionService {
    if (!VisionService.instance) VisionService.instance = new VisionService();
    return VisionService.instance;
  }

  async analyzeImage(
    imageBase64: string,
    prompt?: string
  ): Promise<VisionResponse> {
    const finalPrompt =
      (prompt && prompt.trim().length > 0 ? prompt : DEFAULT_PROMPT) +
      "\n\nОтвечай строго на русском языке.";

    const base64 = imageBase64.startsWith('data:')
      ? imageBase64.split(',')[1]
      : imageBase64;

    const response = await fetch(`${GATEWAY_BASE}/vision`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ imageBase64: base64, prompt: finalPrompt }),
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Vision API error' }));
      throw new Error((err as { error?: string }).error || `HTTP ${response.status}`);
    }

    return response.json() as Promise<VisionResponse>;
  }

  async analyzeCameraFrame(
    videoElement: HTMLVideoElement,
    prompt?: string
  ): Promise<VisionResponse> {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas not available');

    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    return this.analyzeImage(dataUrl, prompt);
  }
}

export const visionService = VisionService.getInstance();
