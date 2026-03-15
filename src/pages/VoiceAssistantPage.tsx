import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Volume2, X, Settings2, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";

type OrbState = "idle" | "listening" | "processing" | "speaking";

const cannedResponses = [
  "I'd be happy to help you with that. Based on what I understand, here's what I think we should consider...",
  "That's an interesting question. Let me think about this for a moment. The key factors here are...",
  "I can see a few different approaches to this. The most effective one would likely involve...",
  "Great observation! From my analysis, I'd suggest focusing on the following aspects...",
];

export default function VoiceAssistantPage() {
  const [orbState, setOrbState] = useState<OrbState>("idle");
  const [transcript, setTranscript] = useState("");
  const [response, setResponse] = useState("");
  const [history, setHistory] = useState<Array<{ role: "user" | "assistant"; text: string }>>([]);
  const [waveformData, setWaveformData] = useState<number[]>(Array(40).fill(0.1));
  const waveIntervalRef = useRef<ReturnType<typeof setInterval>>();

  const generateWaveform = useCallback((intensity: number) => {
    return Array(40).fill(0).map(() => Math.random() * intensity + 0.05);
  }, []);

  useEffect(() => {
    if (orbState === "listening" || orbState === "speaking") {
      const intensity = orbState === "listening" ? 0.6 : 0.9;
      waveIntervalRef.current = setInterval(() => {
        setWaveformData(generateWaveform(intensity));
      }, 80);
    } else {
      setWaveformData(generateWaveform(0.08));
    }
    return () => { if (waveIntervalRef.current) clearInterval(waveIntervalRef.current); };
  }, [orbState, generateWaveform]);

  const startVoice = useCallback(() => {
    if (orbState !== "idle") return;

    setOrbState("listening");
    setTranscript("");
    setResponse("");

    // Simulate speech recognition
    const phrases = ["Can you help me understand", "how neural networks", "process visual information?"];
    let i = 0;
    const typeInterval = setInterval(() => {
      if (i < phrases.length) {
        setTranscript((prev) => (prev ? prev + " " : "") + phrases[i]);
        i++;
      } else {
        clearInterval(typeInterval);
        const fullTranscript = phrases.join(" ");
        setHistory((prev) => [...prev, { role: "user", text: fullTranscript }]);

        setOrbState("processing");
        setTimeout(() => {
          setOrbState("speaking");
          const resp = cannedResponses[Math.floor(Math.random() * cannedResponses.length)];
          let j = 0;
          const words = resp.split(" ");
          const speakInterval = setInterval(() => {
            if (j < words.length) {
              setResponse((prev) => (prev ? prev + " " : "") + words[j]);
              j++;
            } else {
              clearInterval(speakInterval);
              setHistory((prev) => [...prev, { role: "assistant", text: resp }]);
              setTimeout(() => setOrbState("idle"), 500);
            }
          }, 60);
        }, 2000);
      }
    }, 800);
  }, [orbState]);

  const stopVoice = useCallback(() => {
    setOrbState("idle");
    setTranscript("");
    setResponse("");
  }, []);

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] bg-background overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
            <Waves className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Voice Assistant</h1>
            <p className="text-[10px] text-muted-foreground">Speech Recognition • TTS • Real-time</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <Settings2 className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center relative">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden">
          <motion.div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)",
            }}
            animate={{
              scale: orbState === "speaking" ? [1, 1.15, 1] : orbState === "listening" ? [1, 1.1, 1] : [1, 1.03, 1],
            }}
            transition={{ repeat: Infinity, duration: orbState === "idle" ? 4 : 2 }}
          />
        </div>

        {/* Orb */}
        <motion.button
          onClick={orbState === "idle" ? startVoice : stopVoice}
          className="relative z-10 cursor-pointer focus:outline-none"
          whileTap={{ scale: 0.95 }}
        >
          {/* Glow halo */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: "radial-gradient(circle, hsl(var(--primary) / 0.4), transparent 70%)",
            }}
            animate={{
              scale: orbState === "speaking" ? [1.4, 1.6, 1.4] : orbState === "listening" ? [1.3, 1.5, 1.3] : [1.2, 1.3, 1.2],
              opacity: orbState === "speaking" ? [0.6, 0.8, 0.6] : orbState === "listening" ? [0.4, 0.6, 0.4] : [0.2, 0.3, 0.2],
            }}
            transition={{ repeat: Infinity, duration: orbState === "idle" ? 4 : 1.5 }}
          />

          {/* Ripple rings */}
          <AnimatePresence>
            {orbState === "listening" && [0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border border-primary/30"
                initial={{ scale: 1, opacity: 0.5 }}
                animate={{ scale: [1, 2.5], opacity: [0.4, 0] }}
                transition={{ repeat: Infinity, duration: 2, delay: i * 0.6 }}
              />
            ))}
          </AnimatePresence>

          {/* Main orb */}
          <motion.div
            className="w-28 h-28 rounded-full relative overflow-hidden"
            animate={{
              scale: orbState === "listening" ? 1.1 : orbState === "speaking" ? [1, 1.03, 1] : 1,
            }}
            transition={{ type: "spring", stiffness: 200 }}
          >
            {/* Core gradient */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary via-blue-400 to-cyan-400" />

            {/* Liquid layer */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{
                background: "radial-gradient(circle at 30% 30%, hsl(var(--primary) / 0.9), transparent 50%), radial-gradient(circle at 70% 70%, hsl(190 90% 60% / 0.8), transparent 50%), radial-gradient(circle at 50% 50%, white / 0.3, transparent 40%)",
              }}
              animate={{
                rotate: orbState === "processing" ? 360 : 0,
                scale: orbState === "speaking" ? [1, 1.05, 1] : 1,
              }}
              transition={{
                rotate: { repeat: Infinity, duration: 3, ease: "linear" },
                scale: { repeat: Infinity, duration: 0.3 },
              }}
            />

            {/* Shimmer overlay */}
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.2), transparent 50%, rgba(255,255,255,0.1))" }}
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
            />

            {/* Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {orbState === "idle" ? (
                <Mic className="h-8 w-8 text-primary-foreground drop-shadow-lg" />
              ) : orbState === "listening" ? (
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 0.8 }}>
                  <Mic className="h-8 w-8 text-primary-foreground drop-shadow-lg" />
                </motion.div>
              ) : orbState === "processing" ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <Settings2 className="h-7 w-7 text-primary-foreground drop-shadow-lg" />
                </motion.div>
              ) : (
                <motion.div animate={{ scale: [1, 1.15, 1] }} transition={{ repeat: Infinity, duration: 0.5 }}>
                  <Volume2 className="h-8 w-8 text-primary-foreground drop-shadow-lg" />
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.button>

        {/* State label */}
        <motion.p
          className="mt-6 text-xs font-medium text-muted-foreground capitalize z-10"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          {orbState === "idle" ? "Tap to speak" : orbState}
        </motion.p>

        {/* Waveform */}
        <div className="mt-8 flex items-end gap-0.5 h-12 z-10">
          {waveformData.map((v, i) => (
            <motion.div
              key={i}
              className="w-1 rounded-full bg-primary/60"
              animate={{ height: v * 48 }}
              transition={{ duration: 0.08 }}
            />
          ))}
        </div>

        {/* Live transcript */}
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

      {/* Bottom history */}
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
