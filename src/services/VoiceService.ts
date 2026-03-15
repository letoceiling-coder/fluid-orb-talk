export type VoiceServiceCallback = (text: string) => void;
export type VoiceErrorCallback = (error: string) => void;

export interface StartMicOptions {
  language?: string;
  onInterim?: VoiceServiceCallback;
  onFinal?: VoiceServiceCallback;
  onError?: VoiceErrorCallback;
}

export interface TextToSpeechOptions {
  voice?: string;
  language?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
}

export class VoiceService {
  private static instance: VoiceService;
  private recognition: SpeechRecognition | null = null;
  private isListening = false;
  private currentAudio: HTMLAudioElement | null = null;

  static getInstance(): VoiceService {
    if (!VoiceService.instance) VoiceService.instance = new VoiceService();
    return VoiceService.instance;
  }

  get supported(): boolean {
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  get ttsSupported(): boolean {
    return 'speechSynthesis' in window;
  }

  startMic(options: StartMicOptions = {}): void {
    const {
      language = 'ru-RU',
      onInterim = () => undefined,
      onFinal = () => undefined,
      onError,
    } = options;

    if (!this.supported) {
      onError?.('Speech recognition not supported in this browser');
      return;
    }

    const SR = (
      window.SpeechRecognition ||
      (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition
    );
    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = language;

    this.recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = '';
      let final = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          final += result[0].transcript;
        } else {
          interim += result[0].transcript;
        }
      }
      if (interim) onInterim(interim);
      if (final) onFinal(final);
    };

    this.recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      onError?.(event.error);
      this.isListening = false;
    };

    this.recognition.onend = () => {
      this.isListening = false;
    };

    this.recognition.start();
    this.isListening = true;
  }

  stopMic(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
  }

  async speechToText(audio?: Blob, language = 'ru'): Promise<string> {
    if (audio) {
      const formData = new FormData();
      formData.append('audio', audio, 'speech.webm');
      formData.append('language', language);
      const response = await fetch('/gateway/stt', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error(`STT HTTP ${response.status}`);
      }
      const data = await response.json() as { transcript?: string };
      return data.transcript ?? '';
    }

    if (!this.supported) {
      throw new Error('Speech recognition not supported in this browser');
    }

    return new Promise<string>((resolve, reject) => {
      this.startMic({
        language: language.toLowerCase().startsWith('ru') ? 'ru-RU' : language,
        onFinal: (text) => {
          this.stopMic();
          resolve(text);
        },
        onError: (err) => reject(new Error(err)),
      });
    });
  }

  async textToSpeech(text: string, options: TextToSpeechOptions = {}): Promise<Blob> {
    const response = await fetch('/gateway/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({
        text,
        voice: options.voice,
        language: options.language ?? 'ru',
      }),
    });
    if (!response.ok) {
      throw new Error(`TTS HTTP ${response.status}`);
    }
    return response.blob();
  }

  playAudio(audio: Blob | string): Promise<void> {
    const objectUrl = typeof audio === 'string' ? audio : URL.createObjectURL(audio);
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    return new Promise<void>((resolve, reject) => {
      const player = new Audio(objectUrl);
      this.currentAudio = player;
      player.onended = () => {
        if (typeof audio !== 'string') URL.revokeObjectURL(objectUrl);
        if (this.currentAudio === player) this.currentAudio = null;
        resolve();
      };
      player.onerror = () => {
        if (typeof audio !== 'string') URL.revokeObjectURL(objectUrl);
        if (this.currentAudio === player) this.currentAudio = null;
        reject(new Error('Failed to play audio'));
      };
      void player.play().catch((err) => {
        if (typeof audio !== 'string') URL.revokeObjectURL(objectUrl);
        if (this.currentAudio === player) this.currentAudio = null;
        reject(err instanceof Error ? err : new Error(String(err)));
      });
    });
  }

  startListening(
    onTranscript: VoiceServiceCallback,
    onFinal: VoiceServiceCallback,
    onError?: VoiceErrorCallback
  ): void {
    this.startMic({
      language: 'ru-RU',
      onInterim: onTranscript,
      onFinal,
      onError,
    });
  }

  stopListening(): void {
    this.stopMic();
  }

  speak(text: string, options: { rate?: number; pitch?: number; volume?: number } = {}): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.ttsSupported) {
        reject(new Error('Text-to-speech not supported'));
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options.rate ?? 1;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;
      utterance.lang = 'ru-RU';

      utterance.onend = () => resolve();
      utterance.onerror = (e) => reject(new Error(e.error));

      window.speechSynthesis.speak(utterance);
    });
  }

  cancel(): void {
    this.stopListening();
    this.stopMic();
    if (this.currentAudio) {
      this.currentAudio.pause();
      this.currentAudio = null;
    }
    if (this.ttsSupported) window.speechSynthesis.cancel();
  }

  get listening(): boolean {
    return this.isListening;
  }
}

export const voiceService = VoiceService.getInstance();
