import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Paperclip, Mic, Camera, Plus, Search, Settings2, Bot, User,
  Loader2, Radio, Coins, Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { assistantService, type ChatMessage, type TokenUsage } from "@/services/AssistantService";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Msg {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  provider?: string;
  model?:    string;
  usage?:    TokenUsage;
  streaming?: boolean;
  error?:    boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MODELS = [
  { value: "gpt-4o-mini",           label: "GPT-4o mini",        provider: "OpenAI"    },
  { value: "gpt-4o",                label: "GPT-4o",             provider: "OpenAI"    },
  { value: "claude-3-5-haiku-20241022", label: "Claude 3.5 Haiku", provider: "Anthropic" },
  { value: "gemini-2.0-flash",      label: "Gemini 2.0 Flash",   provider: "Google"    },
];

const LOG_PREFIX = "[AI Studio]";

// ─── Component ────────────────────────────────────────────────────────────────

export default function AIStudio() {
  const [msgs,          setMsgs]          = useState<Msg[]>([]);
  const [prompt,        setPrompt]        = useState("");
  const [model,         setModel]         = useState("gpt-4o-mini");
  const [temperature,   setTemperature]   = useState([0.7]);
  const [maxTokens,     setMaxTokens]     = useState([1024]);
  const [topP,          setTopP]          = useState([1.0]);
  const [systemPrompt,  setSystemPrompt]  = useState("You are a helpful assistant.");
  const [loading,       setLoading]       = useState(false);
  const [streamMode,    setStreamMode]    = useState(false);
  const [error,         setError]         = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const historyRef     = useRef<ChatMessage[]>([]);
  const wsRef          = useRef<WebSocket | null>(null);
  const textareaRef    = useRef<HTMLTextAreaElement>(null);

  // ── Auto-scroll ───────────────────────────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [msgs]);

  // ── Cleanup WS on unmount ─────────────────────────────────────────────────
  useEffect(() => () => { wsRef.current?.close(); }, []);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const addMsg = useCallback((msg: Omit<Msg, "id">) => {
    const full: Msg = { id: crypto.randomUUID(), ...msg };
    setMsgs((prev) => [...prev, full]);
    return full;
  }, []);

  const patchMsg = useCallback((id: string, patch: Partial<Msg>) => {
    setMsgs((prev) => prev.map((m) => m.id === id ? { ...m, ...patch } : m));
  }, []);

  const buildContext = useCallback((content: string): ChatMessage[] => [
    ...(systemPrompt ? [{ role: "system" as const, content: systemPrompt }] : []),
    ...historyRef.current,
    { role: "user", content },
  ], [systemPrompt]);

  // ── HTTP send ─────────────────────────────────────────────────────────────
  const sendHTTP = useCallback(async (content: string) => {
    const context = buildContext(content);
    const payload = { messages: context, model };
    console.log(`${LOG_PREFIX} HTTP request:`, payload);

    setLoading(true);
    setError(null);

    try {
      const result = await assistantService.sendMessage(context, { model });
      console.log(`${LOG_PREFIX} HTTP response:`, result);

      const assistantMsg = addMsg({
        role:     "assistant",
        content:  result.message,
        provider: result.provider,
        model:    result.model,
        usage:    result.usage,
      });

      historyRef.current = [
        ...historyRef.current,
        { role: "user", content },
        { role: "assistant", content: result.message },
      ];

      return assistantMsg;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      setError(msg);
      console.error(`${LOG_PREFIX} HTTP error:`, msg);
      addMsg({ role: "assistant", content: `Error: ${msg}`, error: true });
    } finally {
      setLoading(false);
    }
  }, [model, buildContext, addMsg]);

  // ── WebSocket streaming send ───────────────────────────────────────────────
  const sendWS = useCallback((content: string) => {
    wsRef.current?.close();

    const proto     = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url       = `${proto}//${window.location.host}/gateway/stream`;
    const context   = buildContext(content);
    const sessionId = crypto.randomUUID();

    console.log(`${LOG_PREFIX} WS connecting to`, url);
    const ws = new WebSocket(url);
    wsRef.current = ws;

    setLoading(true);
    setError(null);

    // Placeholder for streamed response
    const placeholderId = crypto.randomUUID();
    setMsgs((prev) => [...prev, { id: placeholderId, role: "assistant", content: "", streaming: true }]);

    let accumulated = "";

    ws.onopen = () => {
      console.log(`${LOG_PREFIX} WebSocket connected`);
      const payload = { type: "chat", messages: context, model, sessionId };
      console.log(`${LOG_PREFIX} WS request:`, payload);
      ws.send(JSON.stringify(payload));
    };

    ws.onmessage = (ev) => {
      const d = JSON.parse(ev.data as string) as {
        type: string; chunk?: string; usage?: TokenUsage; provider?: string; error?: string;
      };

      if (d.type === "chat/chunk" && d.chunk) {
        accumulated += d.chunk;
        patchMsg(placeholderId, { content: accumulated });
      }

      if (d.type === "chat/done") {
        console.log(`${LOG_PREFIX} WS stream done:`, { chars: accumulated.length, usage: d.usage });
        patchMsg(placeholderId, { streaming: false, usage: d.usage, provider: d.provider ?? model });
        historyRef.current = [
          ...historyRef.current,
          { role: "user", content },
          { role: "assistant", content: accumulated },
        ];
        setLoading(false);
        ws.close();
      }

      if (d.type === "chat/error") {
        console.error(`${LOG_PREFIX} WS error:`, d.error);
        setError(d.error ?? "Stream error");
        patchMsg(placeholderId, { content: `Error: ${d.error}`, streaming: false, error: true });
        setLoading(false);
        ws.close();
      }
    };

    ws.onerror = () => {
      const msg = "WebSocket connection failed";
      console.error(`${LOG_PREFIX}`, msg);
      setError(msg);
      patchMsg(placeholderId, { content: `Error: ${msg}`, streaming: false, error: true });
      setLoading(false);
    };
  }, [model, buildContext, patchMsg]);

  // ── Main send handler ─────────────────────────────────────────────────────
  const handleSend = useCallback(async () => {
    const content = prompt.trim();
    if (!content || loading) return;

    setPrompt("");
    addMsg({ role: "user", content });

    if (streamMode) {
      sendWS(content);
    } else {
      await sendHTTP(content);
    }

    textareaRef.current?.focus();
  }, [prompt, loading, streamMode, addMsg, sendHTTP, sendWS]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ── New conversation ──────────────────────────────────────────────────────
  const newConversation = useCallback(() => {
    wsRef.current?.close();
    setMsgs([]);
    setError(null);
    historyRef.current = [];
    console.log(`${LOG_PREFIX} New conversation started`);
  }, []);

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex h-[calc(100vh-3rem)]">

      {/* ── Left — Conversations ──────────────────────────────────────────── */}
      <div className="w-72 border-r border-border/50 flex flex-col shrink-0 hidden lg:flex">
        <div className="p-3 space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2 text-xs h-9 bg-secondary/30 border-border/50"
            onClick={newConversation}
          >
            <Plus className="h-3.5 w-3.5" /> New Conversation
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              className="w-full h-8 pl-8 pr-3 rounded-md bg-secondary/30 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50"
              placeholder="Search conversations..."
            />
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin px-2 space-y-0.5">
          <button className="w-full text-left px-3 py-2.5 rounded-lg text-xs bg-accent text-foreground">
            <div className="font-medium truncate">
              {msgs.length > 0
                ? msgs.find((m) => m.role === "user")?.content.slice(0, 36) ?? "Current session"
                : "New conversation"}
            </div>
            <div className="text-[10px] text-muted-foreground/60 mt-0.5">
              {msgs.length} message{msgs.length !== 1 ? "s" : ""}
            </div>
          </button>
        </div>
      </div>

      {/* ── Center — Chat ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Chat toolbar */}
        <div className="h-11 border-b border-border/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">AI Studio</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">
              {MODELS.find((m) => m.value === model)?.label ?? model}
            </span>
          </div>

          {/* Streaming toggle */}
          <button
            className={`flex items-center gap-1.5 text-[10px] px-2 py-1 rounded-full border transition-colors ${
              streamMode
                ? "bg-primary/20 border-primary/40 text-primary"
                : "bg-secondary/30 border-border/40 text-muted-foreground"
            }`}
            onClick={() => setStreamMode((v) => !v)}
            title={streamMode ? "Streaming ON (WebSocket)" : "Click to enable streaming"}
          >
            <Radio className="h-3 w-3" />
            {streamMode ? "Streaming" : "Standard"}
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-4">
          {msgs.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <Bot className="h-10 w-10 text-muted-foreground/20" />
              <p className="text-xs text-muted-foreground/50">Send a message to start the conversation</p>
              <p className="text-[10px] text-muted-foreground/30">
                Connected to {MODELS.find((m) => m.value === model)?.provider} · {streamMode ? "WebSocket streaming" : "HTTP"}
              </p>
            </div>
          )}

          {msgs.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}
            >
              {m.role === "assistant" && (
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}

              <div className="flex flex-col gap-1 max-w-2xl">
                <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                  m.error
                    ? "bg-destructive/10 border border-destructive/20 text-destructive"
                    : m.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "glass-panel text-foreground"
                }`}>
                  <pre className="whitespace-pre-wrap font-sans">
                    {m.content}
                    {m.streaming && (
                      <span className="inline-block w-1.5 h-4 bg-primary/60 animate-pulse ml-0.5 align-text-bottom rounded-sm" />
                    )}
                  </pre>
                </div>

                {/* Metadata row */}
                {m.role === "assistant" && !m.streaming && (m.provider || m.usage) && (
                  <div className="flex items-center gap-3 px-1">
                    {m.provider && (
                      <span className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
                        <Cpu className="h-2.5 w-2.5" />
                        {m.provider}{m.model ? ` · ${m.model}` : ""}
                      </span>
                    )}
                    {m.usage && (
                      <span className="flex items-center gap-1 text-[9px] text-muted-foreground/60">
                        <Coins className="h-2.5 w-2.5" />
                        {m.usage.total_tokens} tokens
                      </span>
                    )}
                  </div>
                )}
              </div>

              {m.role === "user" && (
                <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}

          {/* Loading indicator (HTTP mode) */}
          <AnimatePresence>
            {loading && !streamMode && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="flex gap-3"
              >
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="glass-panel rounded-xl px-4 py-3 flex items-center gap-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
                      animate={{ y: [0, -4, 0] }}
                      transition={{ repeat: Infinity, duration: 0.8, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error banner */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <span className="text-[10px] text-destructive bg-destructive/10 px-3 py-1 rounded-full">
                  {error}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border/50">
          <div className="glass-panel p-2 flex items-end gap-2">
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Paperclip className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Mic className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground">
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <Textarea
              ref={textareaRef}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Send a message… (Enter to send, Shift+Enter for newline)"
              className="min-h-[40px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm"
              rows={1}
            />
            <Button
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={handleSend}
              disabled={!prompt.trim() || loading}
            >
              {loading && !streamMode
                ? <Loader2 className="h-4 w-4 animate-spin" />
                : <Send className="h-4 w-4" />
              }
            </Button>
          </div>
        </div>
      </div>

      {/* ── Right — Configuration ─────────────────────────────────────────── */}
      <div className="w-80 border-l border-border/50 p-4 space-y-5 overflow-auto scrollbar-thin shrink-0 hidden xl:block">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Configuration
          </h3>
        </div>

        <div className="space-y-4">
          {/* Model */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Model</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-9 bg-secondary/30 border-border/50 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    <span>{m.label}</span>
                    <span className="ml-2 text-[10px] text-muted-foreground">{m.provider}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Temperature</label>
              <span className="text-xs text-foreground tabular-nums">{temperature[0]}</span>
            </div>
            <Slider value={temperature} onValueChange={setTemperature} min={0} max={2} step={0.1} className="py-1" />
          </div>

          {/* Max Tokens */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Max Tokens</label>
              <span className="text-xs text-foreground tabular-nums">{maxTokens[0]}</span>
            </div>
            <Slider value={maxTokens} onValueChange={setMaxTokens} min={256} max={4096} step={256} className="py-1" />
          </div>

          {/* Top P */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Top P</label>
              <span className="text-xs text-foreground tabular-nums">{topP[0]}</span>
            </div>
            <Slider value={topP} onValueChange={setTopP} min={0} max={1} step={0.05} className="py-1" />
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">System Prompt</label>
            <Textarea
              value={systemPrompt}
              onChange={(e) => setSystemPrompt(e.target.value)}
              className="min-h-[100px] bg-secondary/30 border-border/50 text-xs resize-none"
              placeholder="You are a helpful assistant..."
            />
          </div>

          {/* Session stats */}
          {msgs.length > 0 && (
            <div className="pt-2 border-t border-border/30 space-y-1">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Session</p>
              <p className="text-xs text-foreground/70">{msgs.length} messages</p>
              {msgs.filter((m) => m.usage).length > 0 && (
                <p className="text-xs text-foreground/70">
                  {msgs.reduce((sum, m) => sum + (m.usage?.total_tokens ?? 0), 0)} total tokens
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
