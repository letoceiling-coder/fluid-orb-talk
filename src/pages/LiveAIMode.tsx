import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, CameraOff, Mic, MicOff, Zap, Maximize2, Minimize2, Volume2,
  Aperture, MessageSquare, Waves, Eye, X
} from "lucide-react";
import { Button } from "@/components/ui/button";

type AIState = "idle" | "listening" | "analyzing" | "responding";

interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  timestamp: Date;
}

const cannedConversation = [
  { role: "assistant" as const, text: "I can see your camera feed. I'm ready to analyze what I see and respond to your voice commands." },
  { role: "assistant" as const, text: "I notice several interesting elements in the frame. The lighting appears to be artificial, and I can detect what looks like a workspace setup." },
  { role: "assistant" as const, text: "Based on my visual analysis combined with your question, I'd suggest organizing the visible elements by category for better workflow efficiency." },
];

export default function LiveAIMode() {
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive, setMicActive] = useState(false);
  const [aiState, setAIState] = useState<AIState>("idle");
  const [messages, setMessages] = useState<Message[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(30).fill(0.05));
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const responseIndex = useRef(0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (aiState === "listening" || aiState === "responding") {
      interval = setInterval(() => {
        setWaveform(Array(30).fill(0).map(() => Math.random() * (aiState === "responding" ? 0.9 : 0.5) + 0.05));
      }, 80);
    } else {
      setWaveform(Array(30).fill(0).map(() => Math.random() * 0.08 + 0.02));
    }
    return () => clearInterval(interval);
  }, [aiState]);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
      setCameraActive(true);
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "system",
        text: "Camera activated. AI vision is now monitoring the feed.",
        timestamp: new Date(),
      }]);
    } catch {
      setCameraActive(true);
    }
  }, []);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraActive(false);
  }, []);

  const toggleMic = useCallback(() => {
    if (micActive) {
      setMicActive(false);
      setAIState("idle");
      return;
    }

    setMicActive(true);
    setAIState("listening");

    // Simulate: listen → user speaks → analyzing → AI responds
    setTimeout(() => {
      setMessages((prev) => [...prev, {
        id: crypto.randomUUID(),
        role: "user",
        text: "What can you see in the camera right now? Can you describe the scene?",
        timestamp: new Date(),
      }]);
      setAIState("analyzing");

      setTimeout(() => {
        setAIState("responding");
        const resp = cannedConversation[responseIndex.current % cannedConversation.length];
        responseIndex.current++;
        setMessages((prev) => [...prev, {
          id: crypto.randomUUID(),
          role: "assistant",
          text: resp.text,
          timestamp: new Date(),
        }]);

        setTimeout(() => {
          setAIState("idle");
          setMicActive(false);
        }, 3000);
      }, 2000);
    }, 2500);
  }, [micActive]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  return (
    <div className={`flex flex-col h-[calc(100vh-3rem)] bg-background ${fullscreen ? "fixed inset-0 z-50" : ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-border/30">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/20">
              <Zap className="h-4 w-4 text-primary" />
            </div>
            {aiState !== "idle" && (
              <motion.div
                className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-background"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1 }}
              />
            )}
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">Live AI Mode</h1>
            <p className="text-[10px] text-muted-foreground">Camera + Voice + AI • Real-time Conversation</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AnimatePresence>
            {aiState !== "idle" && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2 px-3 py-1 rounded-full border border-primary/30 bg-primary/5"
              >
                <motion.div
                  className="h-1.5 w-1.5 rounded-full bg-primary"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ repeat: Infinity, duration: 0.8 }}
                />
                <span className="text-[10px] text-primary font-medium capitalize">{aiState}</span>
              </motion.div>
            )}
          </AnimatePresence>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Camera + Orb */}
        <div className="flex-1 relative bg-black/90 flex items-center justify-center">
          {cameraActive ? (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover opacity-80" />
          ) : (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <Camera className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm">Camera off</p>
              <Button onClick={startCamera} size="sm" className="gap-2">
                <Camera className="h-3.5 w-3.5" /> Enable
              </Button>
            </div>
          )}

          {/* Floating AI orb */}
          <motion.div
            className="absolute bottom-24 left-1/2 -translate-x-1/2"
            animate={{ y: aiState === "responding" ? [0, -3, 0] : 0 }}
            transition={{ repeat: Infinity, duration: 0.4 }}
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-gradient-to-br from-primary via-blue-400 to-cyan-400 flex items-center justify-center shadow-lg shadow-primary/30"
              animate={{
                scale: aiState === "listening" ? [1, 1.15, 1] : aiState === "responding" ? [1, 1.05, 1] : 1,
                boxShadow: aiState !== "idle"
                  ? ["0 0 20px hsl(var(--primary) / 0.3)", "0 0 40px hsl(var(--primary) / 0.5)", "0 0 20px hsl(var(--primary) / 0.3)"]
                  : "0 0 20px hsl(var(--primary) / 0.2)",
              }}
              transition={{ repeat: Infinity, duration: aiState === "idle" ? 3 : 1 }}
            >
              {aiState === "listening" ? (
                <Mic className="h-6 w-6 text-primary-foreground" />
              ) : aiState === "analyzing" ? (
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 2, ease: "linear" }}>
                  <Eye className="h-6 w-6 text-primary-foreground" />
                </motion.div>
              ) : aiState === "responding" ? (
                <Volume2 className="h-6 w-6 text-primary-foreground" />
              ) : (
                <Zap className="h-6 w-6 text-primary-foreground" />
              )}
            </motion.div>
          </motion.div>

          {/* Waveform */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-end gap-0.5 h-6">
            {waveform.map((v, i) => (
              <motion.div
                key={i}
                className="w-0.5 rounded-full bg-primary/50"
                animate={{ height: v * 24 }}
                transition={{ duration: 0.08 }}
              />
            ))}
          </div>

          {/* Controls */}
          <div className="absolute bottom-8 right-6 flex flex-col gap-2">
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-full backdrop-blur-lg border ${cameraActive ? "bg-primary/20 border-primary/30 text-primary" : "bg-background/20 border-border/30 text-muted-foreground"}`}
              onClick={cameraActive ? stopCamera : startCamera}
            >
              {cameraActive ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-full backdrop-blur-lg border ${micActive ? "bg-primary/20 border-primary/30 text-primary" : "bg-background/20 border-border/30 text-muted-foreground"}`}
              onClick={toggleMic}
            >
              {micActive ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
            </Button>
          </div>
        </div>

        {/* Chat panel */}
        <div className="w-80 border-l border-border/30 flex flex-col bg-card/30">
          <div className="p-4 border-b border-border/30 flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium text-foreground">Conversation</span>
          </div>
          <div className="flex-1 overflow-auto p-4 space-y-3 scrollbar-thin">
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`text-xs leading-relaxed ${
                  msg.role === "system" ? "text-muted-foreground/60 italic text-center" :
                  msg.role === "user" ? "text-foreground bg-primary/10 rounded-lg px-3 py-2 ml-6" :
                  "text-foreground/80 bg-secondary/30 rounded-lg px-3 py-2 mr-6"
                }`}
              >
                {msg.role !== "system" && (
                  <span className="text-[10px] font-medium text-muted-foreground block mb-1">
                    {msg.role === "user" ? "You" : "AI"}
                  </span>
                )}
                {msg.text}
              </motion.div>
            ))}
            <div ref={messagesEndRef} />
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center gap-2">
                <Waves className="h-8 w-8 text-muted-foreground/20" />
                <p className="text-xs text-muted-foreground/60">Enable camera & mic to start live AI conversation</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
