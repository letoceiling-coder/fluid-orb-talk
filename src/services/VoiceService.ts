export type VoiceServiceCallback = (text: string) => void;
export type VoiceErrorCallback = (error: string) => void;

export class VoiceService {
  private static instance: VoiceService;
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis | null = null;
  private isListening = false;

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

  startListening(
    onTranscript: VoiceServiceCallback,
    onFinal: VoiceServiceCallback,
    onError?: VoiceErrorCallback
  ): void {
    if (!this.supported) {
      onError?.('Speech recognition not supported in this browser');
      return;
    }

    const SR = (window.SpeechRecognition || (window as typeof window & { webkitSpeechRecognition: typeof SpeechRecognition }).webkitSpeechRecognition);
    this.recognition = new SR();
    this.recognition.continuous = true;
    this.recognition.interimResults = true;
    this.recognition.lang = 'ru-RU';

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
      if (interim) onTranscript(interim);
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

  stopListening(): void {
    if (this.recognition && this.isListening) {
      this.recognition.stop();
      this.isListening = false;
    }
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
    if (this.ttsSupported) window.speechSynthesis.cancel();
  }

  get listening(): boolean {
    return this.isListening;
  }
}

export const voiceService = VoiceService.getInstance();
