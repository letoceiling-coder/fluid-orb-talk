import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mic, MicOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useVoice } from '@/hooks/useVoice';

interface VoiceWaveformProps {
  onTranscript?: (text: string) => void;
  onFinalTranscript?: (text: string) => void;
  bars?: number;
  height?: number;
  showButton?: boolean;
  showTranscript?: boolean;
  className?: string;
}

export function VoiceWaveform({
  onTranscript,
  onFinalTranscript,
  bars = 30,
  height = 32,
  showButton = true,
  showTranscript = false,
  className = '',
}: VoiceWaveformProps) {
  const { isListening, transcript, finalTranscript, error, supported, startListening, stopListening } = useVoice();
  const [waveData, setWaveData] = useState<number[]>(() => Array(bars).fill(0.05));
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    if (isListening) {
      intervalRef.current = setInterval(() => {
        setWaveData(Array(bars).fill(0).map(() => Math.random() * 0.7 + 0.05));
      }, 80);
    } else {
      clearInterval(intervalRef.current);
      setWaveData(Array(bars).fill(0).map(() => Math.random() * 0.06 + 0.02));
    }
    return () => clearInterval(intervalRef.current);
  }, [isListening, bars]);

  useEffect(() => {
    if (transcript) onTranscript?.(transcript);
  }, [transcript, onTranscript]);

  useEffect(() => {
    if (finalTranscript) onFinalTranscript?.(finalTranscript);
  }, [finalTranscript, onFinalTranscript]);

  const toggle = () => {
    if (isListening) stopListening();
    else startListening();
  };

  return (
    <div className={`flex flex-col items-center gap-2 ${className}`}>
      {/* Waveform bars */}
      <div
        className="flex items-end gap-0.5"
        style={{ height: `${height}px` }}
      >
        {waveData.map((v, i) => (
          <motion.div
            key={i}
            className={`w-0.5 rounded-full ${isListening ? 'bg-primary' : 'bg-primary/30'}`}
            animate={{ height: v * height }}
            transition={{ duration: 0.08 }}
          />
        ))}
      </div>

      {/* Toggle button */}
      {showButton && (
        <Button
          variant={isListening ? 'default' : 'outline'}
          size="sm"
          className="h-8 gap-2 text-xs"
          onClick={toggle}
          disabled={!supported}
        >
          {isListening ? <MicOff className="h-3.5 w-3.5" /> : <Mic className="h-3.5 w-3.5" />}
          {isListening ? 'Stop' : 'Start'} listening
        </Button>
      )}

      {/* Transcript display */}
      {showTranscript && transcript && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">{transcript}</p>
      )}

      {/* Error */}
      {error && (
        <p className="text-[10px] text-destructive">{error}</p>
      )}
    </div>
  );
}
