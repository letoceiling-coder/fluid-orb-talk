import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, Settings2, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  VoiceAssistantController,
  type VoiceControllerState,
} from "@/controllers/assistant/VoiceAssistantController";

const VOICES = [
  { id: "rachel", name: "Rachel", gender: "Female" },
  { id: "bella", name: "Bella", gender: "Female" },
  { id: "adam", name: "Adam", gender: "Male" },
  { id: "antoni", name: "Antoni", gender: "Male" },
] as const;

type VoiceId = (typeof VOICES)[number]["id"];

export default function VoiceAssistant() {
  const [state, setState] = useState<VoiceControllerState>("INIT");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [wave, setWave] = useState<number[]>(Array(40).fill(0.05));
  const [voice, setVoice] = useState<VoiceId>("rachel");
  const [showSettings, setShowSettings] = useState(false);

  const controllerRef = useRef<VoiceAssistantController | null>(null);

  useEffect(() => {
    const controller = new VoiceAssistantController({
      onStateChange: (next) => setState(next),
      onTranscript: (text, final) => {
        if (!final) setTranscript(text);
        else setTranscript(text);
      },
      onResponse: (text) => {
        setResponse(text);
        setHistory(controller.getHistory());
      },
      onError: (msg) => {
        setResponse(`Ошибка: ${msg}`);
      },
    });
    controller.initialize();
    controllerRef.current = controller;

    return () => {
      controller.destroy();
      controllerRef.current = null;
    };
  }, []);

  useEffect(() => {
    const speaking = state === "SPEAKING";
    const listening = state === "LISTENING" || state === "MIC_REQUESTING";
    const intensity = speaking ? 0.95 : listening ? 0.65 : 0.08;
    const t = setInterval(() => {
      setWave(Array(40).fill(0).map(() => Math.random() * intensity + 0.05));
    }, 90);
    return () => clearInterval(t);
  }, [state]);

  const onOrbClick = useCallback(() => {
    const controller = controllerRef.current;
    if (!controller) return;
    if (state === "LISTENING" || state === "MIC_REQUESTING") {
      controller.stopListening();
      return;
    }
    setTranscript("");
    setResponse("");
    controller.startListening({ voice, language: "ru" });
  }, [state, voice]);

  const stateLabel = useMemo(() => {
    switch (state) {
      case "MIC_REQUESTING":
        return "Запрос доступа к микрофону...";
      case "LISTENING":
        return "Слушаю...";
      case "PROCESSING":
        return "Обрабатываю речь...";
      case "AI_RESPONSE":
        return "Ответ получен";
      case "SPEAKING":
        return "Озвучиваю ответ...";
      case "VOICE_ERROR":
        return "Ошибка голосового режима";
      default:
        return "Нажмите, чтобы говорить";
    }
  }, [state]);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] bg-background overflow-hidden">
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <Waves className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Voice Assistant</h1>
            <p className="text-[10px] text-muted-foreground">Русский STT/TTS по умолчанию</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowSettings((v) => !v)}>
          <Settings2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border/30 bg-card/40"
          >
            <div className="px-6 py-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Голос</p>
              <div className="flex flex-wrap gap-2">
                {VOICES.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => setVoice(v.id)}
                    className={`px-3 py-1.5 rounded-lg border text-xs ${
                      voice === v.id
                        ? "bg-primary/20 border-primary/40 text-primary"
                        : "bg-secondary/30 border-border/40 text-muted-foreground"
                    }`}
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex-1 flex flex-col items-center justify-center relative">
        <motion.button
          onClick={onOrbClick}
          className="relative z-10 cursor-pointer focus:outline-none"
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="w-28 h-28 rounded-full bg-gradient-to-br from-primary via-blue-400 to-cyan-400 flex items-center justify-center"
            animate={{ scale: state === "LISTENING" ? [1, 1.1, 1] : state === "SPEAKING" ? [1, 1.05, 1] : 1 }}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            {state === "LISTENING" || state === "MIC_REQUESTING" ? (
              <MicOff className="h-8 w-8 text-primary-foreground" />
            ) : state === "SPEAKING" ? (
              <Volume2 className="h-8 w-8 text-primary-foreground" />
            ) : (
              <Mic className="h-8 w-8 text-primary-foreground" />
            )}
          </motion.div>
        </motion.button>

        <p className="mt-6 text-xs font-medium text-muted-foreground">{stateLabel}</p>

        <div className="mt-8 flex items-end gap-0.5 h-12 z-10">
          {wave.map((v, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full bg-primary/60"
              animate={{ height: v * 48 }}
              transition={{ duration: 0.08 }}
            />
          ))}
        </div>

        <div className="mt-8 max-w-lg text-center z-10 px-4 min-h-[60px]">
          <AnimatePresence mode="wait">
            {transcript && (
              <motion.p
                key="transcript"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-foreground/80"
              >
                {transcript}
              </motion.p>
            )}
            {response && (
              <motion.p
                key="response"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="text-sm text-primary/90"
              >
                {response}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>

      {history.length > 0 && (
        <div className="border-t border-border/30 max-h-40 overflow-auto scrollbar-thin">
          <div className="px-6 py-3 space-y-2">
            {history.slice(-4).map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                <div className={`max-w-xs px-3 py-1.5 rounded-lg text-xs ${
                  msg.role === "user" ? "bg-primary/20 text-foreground" : "bg-secondary/50 text-foreground/80"
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

