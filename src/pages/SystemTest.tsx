import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Eye, Image as ImageIcon, Volume2, Radio,
  Play, CheckCircle2, XCircle, Loader2, Clock, Cpu, Coins,
  FlaskConical, ChevronDown, ChevronUp, Wifi, WifiOff, PlayCircle,
  AlertTriangle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type TestStatus = "idle" | "running" | "ok" | "error";

interface TokenUsage {
  prompt_tokens:     number;
  completion_tokens: number;
  total_tokens:      number;
}

interface TestResult {
  status:    TestStatus;
  provider?: string;
  model?:    string;
  latencyMs?: number;
  usage?:    TokenUsage;
  preview?:  string;
  error?:    string;
}

const INIT: TestResult = { status: "idle" };

// ─── Helpers ──────────────────────────────────────────────────────────────────

function now() { return performance.now(); }

/** Generate a tiny JPEG via canvas for vision tests */
function makeTestImageBase64(): string {
  const canvas = document.createElement("canvas");
  canvas.width = 64; canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createLinearGradient(0, 0, 64, 64);
  g.addColorStop(0, "#6366f1"); g.addColorStop(1, "#ec4899");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("TEST", 32, 38);
  return canvas.toDataURL("image/jpeg", 0.85).split(",")[1];
}

function wsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/gateway/stream`;
}

function truncate(s: string, n = 200) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: TestStatus }) {
  if (status === "running") return <Loader2 className="h-4 w-4 animate-spin text-primary" />;
  if (status === "ok")      return <CheckCircle2 className="h-4 w-4 text-emerald-400" />;
  if (status === "error")   return <XCircle className="h-4 w-4 text-destructive" />;
  return <div className="h-4 w-4 rounded-full border border-border/40" />;
}

function StatusBadge({ status }: { status: TestStatus }) {
  const map: Record<TestStatus, { label: string; cls: string }> = {
    idle:    { label: "IDLE",    cls: "bg-secondary/60 text-muted-foreground" },
    running: { label: "RUNNING", cls: "bg-primary/20 text-primary" },
    ok:      { label: "PASSED",  cls: "bg-emerald-500/20 text-emerald-400" },
    error:   { label: "FAILED",  cls: "bg-destructive/20 text-destructive" },
  };
  const { label, cls } = map[status];
  return (
    <span className={cn("text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full", cls)}>
      {label}
    </span>
  );
}

function MetaRow({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <Icon className="h-3 w-3 text-muted-foreground flex-shrink-0" />
      <span className="text-muted-foreground">{label}</span>
      <span className="text-foreground/80 font-mono">{value}</span>
    </div>
  );
}

interface TestCardProps {
  icon:     React.ElementType;
  title:    string;
  subtitle: string;
  result:   TestResult;
  onRun:    () => void;
  children?: React.ReactNode;
  accent?:  string;
}

function TestCard({ icon: Icon, title, subtitle, result, onRun, children, accent = "text-primary" }: TestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const isRunning = result.status === "running";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel glow-border rounded-xl overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <div className="flex items-center gap-3">
          <div className={cn("p-2 rounded-lg bg-primary/10", accent === "text-primary" ? "" : "")}>
            <Icon className={cn("h-4 w-4", accent)} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-foreground">{title}</h3>
              <StatusBadge status={result.status} />
            </div>
            <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <StatusIcon status={result.status} />
          <Button
            size="sm"
            variant="outline"
            className="h-7 gap-1.5 text-xs border-border/30"
            onClick={onRun}
            disabled={isRunning}
          >
            {isRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
            Run
          </Button>
        </div>
      </div>

      {/* Result body */}
      <AnimatePresence>
        {result.status !== "idle" && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3">
              {/* Metrics row */}
              <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                {result.provider && (
                  <MetaRow icon={Cpu}   label="Provider" value={result.provider} />
                )}
                {result.model && (
                  <MetaRow icon={Cpu}   label="Model"    value={result.model} />
                )}
                {result.latencyMs !== undefined && (
                  <MetaRow icon={Clock} label="Latency"  value={`${result.latencyMs} ms`} />
                )}
                {result.usage && (
                  <MetaRow
                    icon={Coins}
                    label="Tokens"
                    value={`${result.usage.prompt_tokens} in · ${result.usage.completion_tokens} out · ${result.usage.total_tokens} total`}
                  />
                )}
              </div>

              {/* Error */}
              {result.error && (
                <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-destructive leading-relaxed">{result.error}</p>
                </div>
              )}

              {/* Preview */}
              {result.preview && (
                <div>
                  <button
                    className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors mb-1.5"
                    onClick={() => setExpanded((v) => !v)}
                  >
                    {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    Response preview
                  </button>
                  <AnimatePresence>
                    {expanded && (
                      <motion.pre
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden text-[10px] font-mono text-foreground/70 bg-background/40 border border-border/20 rounded-lg p-3 whitespace-pre-wrap break-all leading-relaxed"
                      >
                        {result.preview}
                      </motion.pre>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Extra content (images, audio, stream logs) */}
              {children && result.status !== "running" && children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── WebSocket stream log ─────────────────────────────────────────────────────

interface WsState {
  connected: boolean;
  chunks:    string[];
  done:      boolean;
  usage?:    TokenUsage;
  error?:    string;
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SystemTest() {
  const [chatResult,    setChatResult]    = useState<TestResult>(INIT);
  const [visionResult,  setVisionResult]  = useState<TestResult>(INIT);
  const [imageResult,   setImageResult]   = useState<TestResult>(INIT);
  const [ttsResult,     setTtsResult]     = useState<TestResult>(INIT);
  const [wsState,       setWsState]       = useState<WsState>({ connected: false, chunks: [], done: false });
  const [wsRunning,     setWsRunning]     = useState(false);

  const imageUrlRef   = useRef<string | null>(null);
  const audioUrlRef   = useRef<string | null>(null);
  const wsRef         = useRef<WebSocket | null>(null);

  // ── Chat ───────────────────────────────────────────────────────────────────
  const runChat = useCallback(async () => {
    setChatResult({ status: "running" });
    const t = now();
    try {
      const res = await fetch("/gateway/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [{ role: "user", content: "Reply with exactly: SYSTEM_TEST_OK" }] }),
      });
      const json = await res.json() as {
        message?: string; provider?: string; model?: string;
        usage?: TokenUsage; error?: string;
      };
      const ms = Math.round(now() - t);
      if (!res.ok || json.error) {
        setChatResult({ status: "error", latencyMs: ms, error: json.error ?? `HTTP ${res.status}` });
      } else {
        setChatResult({
          status: "ok", latencyMs: ms,
          provider: json.provider, model: json.model,
          usage: json.usage ?? undefined,
          preview: json.message,
        });
      }
    } catch (e) {
      setChatResult({ status: "error", latencyMs: Math.round(now() - t), error: String(e) });
    }
  }, []);

  // ── Vision ─────────────────────────────────────────────────────────────────
  const runVision = useCallback(async () => {
    setVisionResult({ status: "running" });
    const t = now();
    try {
      const imageBase64 = makeTestImageBase64();
      const res = await fetch("/gateway/vision", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, prompt: "Describe this image in one short sentence." }),
      });
      const json = await res.json() as {
        description?: string; provider?: string; model?: string;
        usage?: TokenUsage; error?: string;
      };
      const ms = Math.round(now() - t);
      if (!res.ok || json.error) {
        setVisionResult({ status: "error", latencyMs: ms, error: json.error ?? `HTTP ${res.status}` });
      } else {
        setVisionResult({
          status: "ok", latencyMs: ms,
          provider: json.provider, model: json.model,
          usage: json.usage ?? undefined,
          preview: json.description,
        });
      }
    } catch (e) {
      setVisionResult({ status: "error", latencyMs: Math.round(now() - t), error: String(e) });
    }
  }, []);

  // ── Image generation ───────────────────────────────────────────────────────
  const runImage = useCallback(async () => {
    setImageResult({ status: "running" });
    imageUrlRef.current = null;
    const t = now();
    try {
      const res = await fetch("/gateway/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: "A minimal geometric logo on black background" }),
      });
      const json = await res.json() as {
        url?: string; provider?: string; error?: string;
      };
      const ms = Math.round(now() - t);
      if (!res.ok || json.error) {
        setImageResult({ status: "error", latencyMs: ms, error: json.error ?? `HTTP ${res.status}` });
      } else {
        imageUrlRef.current = json.url ?? null;
        setImageResult({
          status: "ok", latencyMs: ms,
          provider: json.provider,
          preview: json.url ? truncate(json.url, 120) : "(no url)",
        });
      }
    } catch (e) {
      setImageResult({ status: "error", latencyMs: Math.round(now() - t), error: String(e) });
    }
  }, []);

  // ── TTS ────────────────────────────────────────────────────────────────────
  const runTts = useCallback(async () => {
    setTtsResult({ status: "running" });
    audioUrlRef.current = null;
    const t = now();
    try {
      const res = await fetch("/gateway/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: "AI Gateway system test successful." }),
      });
      const ms = Math.round(now() - t);
      if (!res.ok) {
        const json = await res.json().catch(() => ({ error: `HTTP ${res.status}` })) as { error?: string };
        setTtsResult({ status: "error", latencyMs: ms, error: json.error ?? `HTTP ${res.status}` });
        return;
      }

      const contentType = res.headers.get("Content-Type") ?? "";
      let blob: Blob;

      if (contentType.includes("audio/")) {
        blob = await res.blob();
      } else {
        const json = await res.json() as { audio?: string; provider?: string };
        if (!json.audio) throw new Error("No audio in response");
        const bytes = Uint8Array.from(atob(json.audio), (c) => c.charCodeAt(0));
        blob = new Blob([bytes], { type: "audio/mpeg" });
      }

      const provider = res.headers.get("X-Provider") ?? "elevenlabs";
      audioUrlRef.current = URL.createObjectURL(blob);
      setTtsResult({
        status: "ok", latencyMs: ms, provider,
        preview: `Audio generated · ${(blob.size / 1024).toFixed(1)} KB`,
      });
    } catch (e) {
      setTtsResult({ status: "error", latencyMs: Math.round(now() - t), error: String(e) });
    }
  }, []);

  // ── WebSocket stream ───────────────────────────────────────────────────────
  const runWs = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsRunning(true);
    setWsState({ connected: false, chunks: [], done: false });

    const url = wsUrl();
    const ws  = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      setWsState((s) => ({ ...s, connected: true }));
      ws.send(JSON.stringify({
        type:     "chat",
        messages: [{ role: "user", content: "Count from 1 to 5, one number per word." }],
      }));
    };

    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data as string) as {
          type: string; chunk?: string; usage?: TokenUsage; error?: string;
        };
        if (msg.type === "chat/chunk" && msg.chunk) {
          setWsState((s) => ({ ...s, chunks: [...s.chunks, msg.chunk!] }));
        }
        if (msg.type === "chat/done") {
          setWsState((s) => ({ ...s, done: true, usage: msg.usage }));
          setWsRunning(false);
          ws.close();
        }
        if (msg.type === "chat/error") {
          setWsState((s) => ({ ...s, error: msg.error, done: true }));
          setWsRunning(false);
          ws.close();
        }
      } catch {/* ignore non-JSON frames */}
    };

    ws.onerror = () => {
      setWsState((s) => ({ ...s, error: `WebSocket error — could not connect to ${url}`, done: true }));
      setWsRunning(false);
    };

    ws.onclose = () => {
      setWsRunning(false);
    };
  }, []);

  // ── Run all ────────────────────────────────────────────────────────────────
  const runAll = useCallback(async () => {
    await runChat();
    await runVision();
    await runImage();
    await runTts();
    runWs();
  }, [runChat, runVision, runImage, runTts, runWs]);

  const allDone = [chatResult, visionResult, imageResult, ttsResult].every(
    (r) => r.status === "ok" || r.status === "error"
  );
  const allOk = [chatResult, visionResult, imageResult, ttsResult].every((r) => r.status === "ok");

  const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
  const item      = { hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-start justify-between flex-wrap gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-1">
            <FlaskConical className="h-5 w-5 text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">System Test</h1>
            <Badge variant="outline" className="text-[9px] font-bold tracking-widest text-amber-400 border-amber-400/30 bg-amber-400/10">
              INTERNAL
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Live health checks for all AI Gateway endpoints
          </p>
        </div>

        <div className="flex items-center gap-3">
          {allDone && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={cn(
                "flex items-center gap-2 text-xs px-3 py-1.5 rounded-full border",
                allOk
                  ? "text-emerald-400 border-emerald-400/30 bg-emerald-400/10"
                  : "text-amber-400 border-amber-400/30 bg-amber-400/10"
              )}
            >
              {allOk
                ? <><CheckCircle2 className="h-3.5 w-3.5" /> All systems operational</>
                : <><AlertTriangle className="h-3.5 w-3.5" /> Some tests failed</>
              }
            </motion.div>
          )}
          <Button
            onClick={runAll}
            className="gap-2"
            disabled={
              chatResult.status === "running" ||
              visionResult.status === "running" ||
              imageResult.status === "running" ||
              ttsResult.status === "running" ||
              wsRunning
            }
          >
            <PlayCircle className="h-4 w-4" />
            Run All Tests
          </Button>
        </div>
      </motion.div>

      {/* ── Test cards ──────────────────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="space-y-3"
      >

        {/* Chat */}
        <motion.div variants={item}>
          <TestCard
            icon={MessageSquare}
            title="Chat"
            subtitle="POST /gateway/chat  ·  openai → anthropic → google"
            result={chatResult}
            onRun={runChat}
            accent="text-blue-400"
          />
        </motion.div>

        {/* Vision */}
        <motion.div variants={item}>
          <TestCard
            icon={Eye}
            title="Vision"
            subtitle="POST /gateway/vision  ·  64×64 canvas JPEG test image"
            result={visionResult}
            onRun={runVision}
            accent="text-violet-400"
          />
        </motion.div>

        {/* Image generation */}
        <motion.div variants={item}>
          <TestCard
            icon={ImageIcon}
            title="Image Generation"
            subtitle="POST /gateway/image  ·  replicate / flux-schnell"
            result={imageResult}
            onRun={runImage}
            accent="text-pink-400"
          >
            {imageResult.status === "ok" && imageUrlRef.current && (
              <div className="mt-2">
                <p className="text-[10px] text-muted-foreground mb-1.5">Generated image:</p>
                <img
                  src={imageUrlRef.current}
                  alt="Generated"
                  className="rounded-lg max-h-48 border border-border/20 object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </TestCard>
        </motion.div>

        {/* TTS */}
        <motion.div variants={item}>
          <TestCard
            icon={Volume2}
            title="Text-to-Speech"
            subtitle="POST /gateway/tts  ·  elevenlabs → openai"
            result={ttsResult}
            onRun={runTts}
            accent="text-amber-400"
          >
            {ttsResult.status === "ok" && audioUrlRef.current && (
              <div className="mt-2">
                <p className="text-[10px] text-muted-foreground mb-1.5">Play audio:</p>
                <audio
                  controls
                  src={audioUrlRef.current}
                  className="w-full h-8 rounded"
                />
              </div>
            )}
          </TestCard>
        </motion.div>

        {/* WebSocket stream */}
        <motion.div variants={item}>
          <motion.div className="glass-panel glow-border rounded-xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-border/20">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Radio className="h-4 w-4 text-emerald-400" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">WebSocket Streaming</h3>
                    <span className={cn(
                      "text-[9px] font-bold tracking-widest px-2 py-0.5 rounded-full",
                      wsRunning
                        ? "bg-primary/20 text-primary"
                        : wsState.done
                          ? wsState.error ? "bg-destructive/20 text-destructive" : "bg-emerald-500/20 text-emerald-400"
                          : "bg-secondary/60 text-muted-foreground"
                    )}>
                      {wsRunning ? "STREAMING" : wsState.done ? (wsState.error ? "FAILED" : "PASSED") : "IDLE"}
                    </span>
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    WS /gateway/stream  ·  chat/chunk events
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {wsState.connected
                  ? <Wifi className="h-4 w-4 text-emerald-400" />
                  : <WifiOff className="h-4 w-4 text-muted-foreground/40" />
                }
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1.5 text-xs border-border/30"
                  onClick={runWs}
                  disabled={wsRunning}
                >
                  {wsRunning ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                  Run
                </Button>
              </div>
            </div>

            {/* Stream body */}
            <AnimatePresence>
              {(wsRunning || wsState.done || wsState.chunks.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4 space-y-3">
                    {/* Metrics */}
                    {wsState.done && !wsState.error && (
                      <div className="flex flex-wrap gap-x-6 gap-y-1.5">
                        {wsState.usage && (
                          <MetaRow
                            icon={Coins}
                            label="Tokens"
                            value={`${wsState.usage.prompt_tokens} in · ${wsState.usage.completion_tokens} out · ${wsState.usage.total_tokens} total`}
                          />
                        )}
                        <MetaRow icon={Radio} label="Chunks" value={String(wsState.chunks.length)} />
                      </div>
                    )}

                    {/* Error */}
                    {wsState.error && (
                      <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
                        <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 flex-shrink-0" />
                        <p className="text-xs text-destructive leading-relaxed">{wsState.error}</p>
                      </div>
                    )}

                    {/* Stream terminal */}
                    {wsState.chunks.length > 0 && (
                      <div>
                        <p className="text-[10px] text-muted-foreground mb-1.5">Stream output:</p>
                        <div className="bg-background/40 border border-border/20 rounded-lg p-3 font-mono text-xs leading-relaxed text-foreground/80 min-h-[40px]">
                          {wsState.chunks.join("")}
                          {wsRunning && (
                            <span className="inline-block w-1.5 h-3.5 bg-primary/60 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>

      </motion.div>

      {/* ── Endpoint reference ───────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="glass-panel rounded-xl p-4"
      >
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">
          Endpoint Reference
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {[
            { method: "POST", path: "/gateway/chat",   desc: "Text chat with fallback chain" },
            { method: "POST", path: "/gateway/vision", desc: "Image analysis (base64 JPEG/PNG)" },
            { method: "POST", path: "/gateway/image",  desc: "Image generation via Replicate" },
            { method: "POST", path: "/gateway/tts",    desc: "Text-to-speech audio (MP3)" },
            { method: "GET",  path: "/gateway/stream", desc: "WebSocket streaming chat" },
          ].map((ep) => (
            <div key={ep.path} className="flex items-center gap-3 py-1.5">
              <span className={cn(
                "text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded flex-shrink-0",
                ep.method === "GET"
                  ? "bg-emerald-500/15 text-emerald-400"
                  : "bg-blue-500/15 text-blue-400"
              )}>
                {ep.method}
              </span>
              <code className="text-[10px] font-mono text-foreground/70 flex-shrink-0">{ep.path}</code>
              <span className="text-[10px] text-muted-foreground truncate">{ep.desc}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
