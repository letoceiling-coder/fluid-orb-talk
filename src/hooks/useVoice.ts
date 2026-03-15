import { useState, useCallback, useEffect, useRef } from 'react';
import { voiceService } from '@/services/VoiceService';

export interface UseVoiceResult {
  isListening: boolean;
  transcript: string;
  finalTranscript: string;
  error: string | null;
  supported: boolean;
  startListening: () => void;
  stopListening: () => void;
  clearTranscript: () => void;
  speak: (text: string) => Promise<void>;
}

export function useVoice(): UseVoiceResult {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [finalTranscript, setFinalTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const accumulatedRef = useRef('');

  useEffect(() => {
    return () => { voiceService.stopListening(); };
  }, []);

  const startListening = useCallback(() => {
    setError(null);
    setTranscript('');
    setFinalTranscript('');
    accumulatedRef.current = '';
    setIsListening(true);

    voiceService.startListening(
      (interim) => {
        setTranscript(accumulatedRef.current + ' ' + interim);
      },
      (final) => {
        accumulatedRef.current = (accumulatedRef.current + ' ' + final).trim();
        setTranscript(accumulatedRef.current);
        setFinalTranscript(accumulatedRef.current);
      },
      (err) => {
        setError(err);
        setIsListening(false);
      }
    );
  }, []);

  const stopListening = useCallback(() => {
    voiceService.stopListening();
    setIsListening(false);
  }, []);

  const clearTranscript = useCallback(() => {
    setTranscript('');
    setFinalTranscript('');
    accumulatedRef.current = '';
  }, []);

  const speak = useCallback(async (text: string) => {
    try {
      await voiceService.speak(text);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'TTS error');
    }
  }, []);

  return {
    isListening,
    transcript,
    finalTranscript,
    error,
    supported: voiceService.supported,
    startListening,
    stopListening,
    clearTranscript,
    speak,
  };
}
