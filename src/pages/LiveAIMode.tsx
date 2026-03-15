import { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera, CameraOff, Mic, MicOff, Zap, Maximize2, Minimize2, Volume2,
  Aperture, MessageSquare, Waves, Eye, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cameraService } from "@/services/CameraService";
import { voiceService } from "@/services/VoiceService";
import { visionService } from "@/services/VisionService";
import { assistantService } from "@/services/AssistantService";

const LOG = "[LiveAI]";

type AIState = "idle" | "listening" | "analyzing" | "responding";

interface Message {
  id:        string;
  role:      "user" | "assistant" | "system";
  text:      string;
  timestamp: Date;
}

// ── Gateway TTS helper ────────────────────────────────────────────────────────
async function speakViaGateway(text: string, voice = "rachel"): Promise<void> {
  console.log(`${LOG} TTS request via /gateway/tts:`, { chars: text.length, voice });
  const res = await fetch("/gateway/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "audio/mpeg" },
    body:    JSON.stringify({ text, voice }),
  });
  if (!res.ok) throw new Error(`TTS HTTP ${res.status}`);
  const blob = await res.blob();
  const url  = URL.createObjectURL(blob);
  return new Promise((resolve, reject) => {
    const audio = new Audio(url);
    audio.onended = () => { URL.revokeObjectURL(url); resolve(); };
    audio.onerror = (e) => { URL.revokeObjectURL(url); reject(e); };
    audio.play().catch(reject);
  });
}

// ── WebSocket streaming helper ────────────────────────────────────────────────
function buildWsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/gateway/stream`;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function LiveAIMode() {
  const [cameraActive, setCameraActive] = useState(false);
  const [micActive,    setMicActive]    = useState(false);
  const [aiState,      setAIState]      = useState<AIState>("idle");
  const [messages,     setMessages]     = useState<Message[]>([]);
  const [fullscreen,   setFullscreen]   = useState(false);
  const [streamMode,   setStreamMode]   = useState(false);
  const [waveform,     setWaveform]     = useState<number[]>(Array(30).fill(0.05));

  const videoRef      = useRef<HTMLVideoElement>(null);
  const messagesEndRef= useRef<HTMLDivElement>(null);
  const historyRef    = useRef<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const wsRef         = useRef<WebSocket | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (aiState === "listening" || aiState === "responding") {
      interval = setInterval(() => {
        setWaveform(Array(30).fill(0).map(() =>
          Math.random() * (aiState === "responding" ? 0.9 : 0.5) + 0.05
        ));
      }, 80);
    } else {
      setWaveform(Array(30).fill(0).map(() => Math.random() * 0.08 + 0.02));
    }
    return () => clearInterval(interval);
  }, [aiState]);

  // Cleanup on unmount
  useEffect(() => () => {
    cameraService.stopCamera();
    voiceService.cancel();
    wsRef.current?.close();
  }, []);

  const addMessage = useCallback((role: Message["role"], text: string) => {
    const msg: Message = { id: crypto.randomUUID(), role, text, timestamp: new Date() };
    setMessages((prev) => [...prev, msg]);
    return msg;
  }, []);

  // ── Camera ─────────────────────────────────────────────────────────────────
  const queueRetry = useCallback(() => {
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    retryTimerRef.current = setTimeout(() => {
      console.log(`${LOG} Retrying camera start`);
      void startCamera();
    }, 300);
  }, []);

  const startCamera = useCallback(async () => {
    console.log("Camera request starting");
    console.log("Video element:", videoRef.current);
    if (!videoRef.current) {
      console.error("videoRef.current is null");
      queueRetry();
      return;
    }
    try {
      const stream = await cameraService.startCamera(videoRef.current);
      console.log("Camera stream obtained", stream);
      console.log("Stream tracks:", stream.getTracks());
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      console.log("Video stream attached to element");
      setCameraActive(true);
      console.log(`${LOG} Camera started`);
      addMessage("system", "Camera activated. AI vision is now monitoring the feed.");
    } catch (err) {
      const name = (err as DOMException).name ?? "Error";
      const msg  = (err as Error).message ?? String(err);
      console.error("Camera start error", err);
      console.error(`${LOG} Camera error:`, name, msg);
      addMessage("system", `Camera unavailable (${name}) — running without video feed.`);
      queueRetry();
    }
  }, [addMessage, queueRetry]);

  const stopCamera = useCallback(() => {
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
      retryTimerRef.current = null;
    }
    cameraService.stopCamera();
    setCameraActive(false);
    console.log(`${LOG} Camera stopped`);
  }, []);

  // ── Voice processing (HTTP) ────────────────────────────────────────────────
  const handleVoiceHTTP = useCallback(async (text: string) => {
    voiceService.stopListening();
    setMicActive(false);
    setAIState("analyzing");
    addMessage("user", text);
    historyRef.current.push({ role: "user", content: text });

    let visionContext = "";
    if (cameraActive) {
      try {
        const frame = cameraService.captureFrame();
        if (frame) {
          console.log(`${LOG} Vision frame sent`);
          const vision = await visionService.analyzeImage(frame, text);
          visionContext = `[Visual context: ${vision.description}]`;
          console.log(`${LOG} Vision response:`, vision.description.slice(0, 100));
        }
      } catch (e) {
        console.warn(`${LOG} Vision failed, text-only:`, e);
      }
    }

    setAIState("responding");
    const contextMessages = [
      ...historyRef.current.slice(0, -1),
      { role: "user" as const, content: visionContext ? `${text}\n${visionContext}` : text },
    ];

    console.log(`${LOG} API call:`, { endpoint: "/gateway/chat", messages: contextMessages.length });

    try {
      const result = await assistantService.sendMessage(contextMessages);
      console.log(`${LOG} Chat response:`, { provider: result.provider, model: result.model, chars: result.message.length, usage: result.usage });
      addMessage("assistant", result.message);
      historyRef.current.push({ role: "assistant", content: result.message });

      // Try ElevenLabs TTS, fall back to Web Speech
      try {
        await speakViaGateway(result.message);
      } catch (ttsErr) {
        console.warn(`${LOG} Gateway TTS failed, falling back to Web Speech:`, ttsErr);
        await voiceService.speak(result.message).catch(() => undefined);
      }
    } catch (e) {
      console.error(`${LOG} Chat error:`, e);
      addMessage("assistant", "Connection error. Please check backend.");
    } finally {
      setAIState("idle");
    }
  }, [cameraActive, addMessage]);

  // ── Voice processing (WebSocket streaming) ─────────────────────────────────
  const handleVoiceWS = useCallback((text: string) => {
    voiceService.stopListening();
    setMicActive(false);
    setAIState("analyzing");
    addMessage("user", text);
    historyRef.current.push({ role: "user", content: text });

    const url = buildWsUrl();
    console.log(`${LOG} WebSocket connecting:`, url);
    wsRef.current?.close();
    const ws = new WebSocket(url);
    wsRef.current = ws;

    const sessionId = crypto.randomUUID();
    const msgId     = crypto.randomUUID();
    let   accumulated = "";

    ws.onopen = () => {
      console.log(`${LOG} WebSocket connected`);
      setAIState("responding");
      const payload = {
        type:      "chat",
        messages:  historyRef.current,
        sessionId,
      };
      console.log(`${LOG} WS request sent`);
      ws.send(JSON.stringify(payload));
      // Add placeholder message
      setMessages((prev) => [...prev, { id: msgId, role: "assistant", text: "", timestamp: new Date() }]);
    };

    ws.onmessage = (ev) => {
      const d = JSON.parse(ev.data as string) as { type: string; chunk?: string; usage?: unknown; error?: string };
      if (d.type === "chat/chunk" && d.chunk) {
        accumulated += d.chunk;
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, text: accumulated } : m));
      }
      if (d.type === "chat/done") {
        console.log(`${LOG} WS stream done:`, { chars: accumulated.length, usage: d.usage });
        historyRef.current.push({ role: "assistant", content: accumulated });
        // Speak the response
        speakViaGateway(accumulated).catch(() =>
          voiceService.speak(accumulated).catch(() => undefined)
        );
        setAIState("idle");
        ws.close();
      }
      if (d.type === "chat/error") {
        console.error(`${LOG} WS error:`, d.error);
        setMessages((prev) => prev.map((m) => m.id === msgId ? { ...m, text: `Error: ${d.error}` } : m));
        setAIState("idle");
        ws.close();
      }
    };

    ws.onerror = () => {
      console.error(`${LOG} WebSocket error`);
      setAIState("idle");
    };
  }, [addMessage]);

  // ── Mic toggle ─────────────────────────────────────────────────────────────
  const toggleMic = useCallback(() => {
    if (micActive) {
      voiceService.stopListening();
      setMicActive(false);
      setAIState("idle");
      return;
    }

    setMicActive(true);
    setAIState("listening");

    if (!voiceService.supported) {
      const fallback = "Describe what you see in the camera.";
      console.warn(`${LOG} Speech API not supported, using fallback`);
      setTimeout(() => (streamMode ? handleVoiceWS(fallback) : handleVoiceHTTP(fallback)), 1000);
      return;
    }

    voiceService.startListening(
      () => undefined,
      (final) => {
        if (streamMode) {
          handleVoiceWS(final);
        } else {
          handleVoiceHTTP(final);
        }
      },
      () => { setMicActive(false); setAIState("idle"); }
    );
  }, [micActive, streamMode, handleVoiceHTTP, handleVoiceWS]);

  // ─────────────────────────────────────────────────────────────────────────

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
          {/* Stream mode toggle */}
          <button
            className={`text-[10px] px-2 py-1 rounded-full border transition-colors ${
              streamMode
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-secondary/30 border-border/40 text-muted-foreground"
            }`}
            onClick={() => setStreamMode((v) => !v)}
            title="Toggle WebSocket streaming"
          >
            {streamMode ? "WS Stream" : "HTTP"}
          </button>

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
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`camera-video w-full h-full object-cover opacity-80 transition-opacity duration-300 ${cameraActive ? "opacity-80" : "opacity-0 absolute pointer-events-none"}`}
          />
          {!cameraActive && (
            <div className="flex flex-col items-center gap-4 text-muted-foreground">
              <Camera className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm">Camera off</p>
              <Button onClick={() => { console.log("Enable camera clicked"); void startCamera(); }} size="sm" className="gap-2">
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
                scale: aiState === "listening"
                  ? [1, 1.15, 1]
                  : aiState === "responding" ? [1, 1.05, 1] : 1,
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
              className={`h-10 w-10 rounded-full backdrop-blur-lg border ${
                cameraActive
                  ? "bg-primary/20 border-primary/30 text-primary"
                  : "bg-background/20 border-border/30 text-muted-foreground"
              }`}
              onClick={cameraActive ? stopCamera : startCamera}
            >
              {cameraActive ? <Camera className="h-4 w-4" /> : <CameraOff className="h-4 w-4" />}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-full backdrop-blur-lg border ${
                micActive
                  ? "bg-primary/20 border-primary/30 text-primary"
                  : "bg-background/20 border-border/30 text-muted-foreground"
              }`}
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
                  msg.role === "system"    ? "text-muted-foreground/60 italic text-center" :
                  msg.role === "user"      ? "text-foreground bg-primary/10 rounded-lg px-3 py-2 ml-6" :
                  "text-foreground/80 bg-secondary/30 rounded-lg px-3 py-2 mr-6"
                }`}
              >
                {msg.role !== "system" && (
                  <span className="text-[10px] font-medium text-muted-foreground block mb-1">
                    {msg.role === "user" ? "You" : "AI"}
                  </span>
                )}
                {msg.text}
                {msg.role === "assistant" && msg.text === "" && (
                  <span className="inline-block w-1 h-3 bg-muted-foreground/50 animate-pulse ml-0.5 rounded-sm" />
                )}
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
