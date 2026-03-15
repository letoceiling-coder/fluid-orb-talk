import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap, Server, Activity, Clock, DollarSign, Shield, Globe, Cpu, ArrowRight,
  ChevronRight, BarChart3, RefreshCw, AlertTriangle, TrendingUp, Layers,
  Network, Database, Lock, Check, X, Settings2, Gauge,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

/* ── Model catalog ── */
const modelCategories = [
  {
    category: "Language Models",
    icon: Cpu,
    models: [
      { name: "GPT-5", provider: "OpenAI", latency: "1.1s", cost: "$0.03/1K", status: "active", load: 78 },
      { name: "GPT-5 Mini", provider: "OpenAI", latency: "0.4s", cost: "$0.005/1K", status: "active", load: 62 },
      { name: "GPT-5 Nano", provider: "OpenAI", latency: "0.2s", cost: "$0.001/1K", status: "active", load: 45 },
      { name: "Claude 4 Sonnet", provider: "Anthropic", latency: "1.3s", cost: "$0.025/1K", status: "active", load: 71 },
      { name: "Claude 4 Haiku", provider: "Anthropic", latency: "0.5s", cost: "$0.004/1K", status: "active", load: 53 },
      { name: "Gemini 2.5 Pro", provider: "Google", latency: "0.9s", cost: "$0.02/1K", status: "active", load: 68 },
      { name: "Gemini 3 Flash", provider: "Google", latency: "0.3s", cost: "$0.003/1K", status: "active", load: 41 },
      { name: "Llama 4 405B", provider: "Meta", latency: "1.8s", cost: "$0.015/1K", status: "active", load: 34 },
      { name: "Mistral Large 3", provider: "Mistral", latency: "1.0s", cost: "$0.012/1K", status: "active", load: 29 },
      { name: "Command R+", provider: "Cohere", latency: "1.2s", cost: "$0.01/1K", status: "standby", load: 0 },
    ],
  },
  {
    category: "Image Models",
    icon: Globe,
    models: [
      { name: "Flux Pro 1.1", provider: "Black Forest", latency: "3.2s", cost: "$0.04/img", status: "active", load: 56 },
      { name: "DALL-E 4", provider: "OpenAI", latency: "4.1s", cost: "$0.08/img", status: "active", load: 42 },
      { name: "Stable Diffusion 4", provider: "Stability", latency: "2.8s", cost: "$0.02/img", status: "active", load: 38 },
      { name: "Midjourney v7", provider: "Midjourney", latency: "5.5s", cost: "$0.06/img", status: "active", load: 61 },
      { name: "Ideogram 3", provider: "Ideogram", latency: "3.8s", cost: "$0.03/img", status: "standby", load: 0 },
    ],
  },
  {
    category: "Video Models",
    icon: Activity,
    models: [
      { name: "Gen-3 Alpha", provider: "Runway", latency: "28s", cost: "$0.50/clip", status: "active", load: 73 },
      { name: "Sora 2", provider: "OpenAI", latency: "35s", cost: "$0.80/clip", status: "active", load: 58 },
      { name: "Pika 2.0", provider: "Pika", latency: "18s", cost: "$0.30/clip", status: "active", load: 44 },
      { name: "Ray 2", provider: "Luma", latency: "22s", cost: "$0.45/clip", status: "active", load: 51 },
      { name: "Kling 2.0", provider: "Kuaishou", latency: "20s", cost: "$0.25/clip", status: "active", load: 37 },
      { name: "Veo 2", provider: "Google", latency: "30s", cost: "$0.60/clip", status: "standby", load: 0 },
    ],
  },
  {
    category: "Audio Models",
    icon: Activity,
    models: [
      { name: "ElevenLabs V3", provider: "ElevenLabs", latency: "0.8s", cost: "$0.015/1K", status: "active", load: 65 },
      { name: "Whisper V4", provider: "OpenAI", latency: "1.2s", cost: "$0.006/min", status: "active", load: 48 },
      { name: "Bark 2", provider: "Suno", latency: "2.1s", cost: "$0.01/1K", status: "active", load: 31 },
      { name: "MusicGen 2", provider: "Meta", latency: "8s", cost: "$0.05/clip", status: "standby", load: 0 },
    ],
  },
  {
    category: "Embedding & Utility",
    icon: Database,
    models: [
      { name: "text-embedding-4", provider: "OpenAI", latency: "0.1s", cost: "$0.0001/1K", status: "active", load: 82 },
      { name: "Voyage 3", provider: "Voyage AI", latency: "0.15s", cost: "$0.00012/1K", status: "active", load: 55 },
      { name: "Cohere Embed v4", provider: "Cohere", latency: "0.12s", cost: "$0.0001/1K", status: "active", load: 40 },
    ],
  },
];

const totalModels = modelCategories.reduce((acc, c) => acc + c.models.length, 0);
const activeModels = modelCategories.reduce((acc, c) => acc + c.models.filter(m => m.status === "active").length, 0);

/* ── Load balancing strategies ── */
const lbStrategies = [
  { name: "Round Robin", desc: "Distribute evenly across providers", active: false, icon: RefreshCw },
  { name: "Weighted Load", desc: "Route based on current provider load %", active: true, icon: Gauge },
  { name: "Latency-First", desc: "Prefer lowest latency provider", active: false, icon: Clock },
  { name: "Cost-Optimized", desc: "Minimize cost per request", active: false, icon: DollarSign },
  { name: "Quality-First", desc: "Route to highest quality model", active: false, icon: TrendingUp },
  { name: "Geo-Aware", desc: "Route to nearest datacenter region", active: false, icon: Globe },
];

/* ── Architecture layers ── */
const archLayers = [
  { label: "Client SDK", desc: "REST / gRPC / WebSocket", icon: Globe, color: "from-blue-500/20 to-blue-500/5" },
  { label: "Auth & Rate Limit", desc: "API keys, quotas, RBAC", icon: Lock, color: "from-amber-500/20 to-amber-500/5" },
  { label: "Smart Router", desc: "Load balance & fallback", icon: Network, color: "from-purple-500/20 to-purple-500/5" },
  { label: "Model Pool", desc: `${totalModels} models, 15+ providers`, icon: Layers, color: "from-emerald-500/20 to-emerald-500/5" },
  { label: "Observability", desc: "Logs, metrics, tracing", icon: BarChart3, color: "from-red-500/20 to-red-500/5" },
];

/* ── Live metrics ── */
const liveStats = [
  { label: "Connected Models", value: totalModels.toString(), icon: Cpu, accent: "text-primary" },
  { label: "Active Models", value: activeModels.toString(), icon: Check, accent: "text-emerald-400" },
  { label: "Providers", value: "15", icon: Server, accent: "text-amber-400" },
  { label: "Avg Latency", value: "1.2s", icon: Clock, accent: "text-cyan-400" },
  { label: "Uptime", value: "99.97%", icon: Shield, accent: "text-emerald-400" },
  { label: "Req / min", value: "4,218", icon: Activity, accent: "text-primary" },
];

/* ── Health feed ── */
const healthFeed = [
  { time: "2s ago", msg: "Routed text/chat → GPT-5 (1.1s)", ok: true },
  { time: "5s ago", msg: "Fallback triggered: Flux Pro → SDXL (timeout)", ok: false },
  { time: "8s ago", msg: "Routed video/gen → Gen-3 Alpha (28s)", ok: true },
  { time: "12s ago", msg: "Load rebalance: shifted 12% traffic Gemini → Claude", ok: true },
  { time: "18s ago", msg: "ElevenLabs V3 latency spike resolved", ok: true },
  { time: "25s ago", msg: "New model registered: Kling 2.0", ok: true },
  { time: "31s ago", msg: "Rate limit warning: workspace #482 (92%)", ok: false },
  { time: "45s ago", msg: "Routed embed → text-embedding-4 (0.1s)", ok: true },
];

export default function AIGatewayCore() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Language Models");

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">AI Gateway Core</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Unified model orchestration · {totalModels} models · 15+ providers · intelligent load balancing
          </p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs">
          <Zap className="w-3 h-3 text-primary" />
          {activeModels} Active
        </Badge>
      </div>

      {/* Live Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {liveStats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="glass-panel p-3 glow-border text-center"
          >
            <s.icon className={cn("w-4 h-4 mx-auto mb-1.5", s.accent)} />
            <div className="text-lg font-semibold text-foreground tabular-nums">{s.value}</div>
            <div className="text-[10px] text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Architecture Diagram */}
      <div className="glass-panel p-6 glow-border">
        <h2 className="text-sm font-medium text-foreground mb-6 text-center">Gateway Architecture</h2>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-2">
          {archLayers.map((layer, i) => (
            <motion.div
              key={layer.label}
              className="flex items-center gap-2"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.12 }}
            >
              <div className={cn(
                "glass-panel p-4 glow-border bg-gradient-to-br flex flex-col items-center gap-1.5 min-w-[120px]",
                layer.color
              )}>
                <motion.div animate={{ scale: [1, 1.08, 1] }} transition={{ repeat: Infinity, duration: 2.5, delay: i * 0.3 }}>
                  <layer.icon className="h-5 w-5 text-foreground" />
                </motion.div>
                <span className="text-[11px] font-medium text-foreground">{layer.label}</span>
                <span className="text-[9px] text-muted-foreground">{layer.desc}</span>
              </div>
              {i < archLayers.length - 1 && (
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}>
                  <ArrowRight className="h-3.5 w-3.5 text-primary hidden lg:block" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="models" className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/50">
          <TabsTrigger value="models" className="text-xs gap-1.5"><Layers className="h-3.5 w-3.5" />Model Pool</TabsTrigger>
          <TabsTrigger value="balancing" className="text-xs gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Load Balancing</TabsTrigger>
          <TabsTrigger value="health" className="text-xs gap-1.5"><Activity className="h-3.5 w-3.5" />Live Health</TabsTrigger>
        </TabsList>

        {/* ── Models Tab ── */}
        <TabsContent value="models" className="space-y-3">
          {modelCategories.map((cat) => {
            const isOpen = expandedCategory === cat.category;
            const activeCount = cat.models.filter(m => m.status === "active").length;
            return (
              <motion.div key={cat.category} layout className="glass-panel glow-border overflow-hidden">
                <button
                  onClick={() => setExpandedCategory(isOpen ? null : cat.category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-accent/20 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <cat.icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{cat.category}</span>
                    <Badge variant="outline" className="text-[9px]">{activeCount}/{cat.models.length}</Badge>
                  </div>
                  <ChevronRight className={cn("h-4 w-4 text-muted-foreground transition-transform", isOpen && "rotate-90")} />
                </button>
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-t border-border/40">
                            {["Model", "Provider", "Status", "Latency", "Cost", "Load"].map(h => (
                              <th key={h} className="text-left py-2.5 px-4 text-muted-foreground font-medium">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {cat.models.map((m, i) => (
                            <motion.tr
                              key={m.name}
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ delay: i * 0.03 }}
                              className="border-t border-border/20 hover:bg-accent/20 transition-colors"
                            >
                              <td className="py-2.5 px-4 font-medium text-foreground">{m.name}</td>
                              <td className="py-2.5 px-4 text-muted-foreground">{m.provider}</td>
                              <td className="py-2.5 px-4">
                                <Badge variant="outline" className={cn(
                                  "text-[9px]",
                                  m.status === "active" ? "border-emerald-500/40 text-emerald-400" : "border-muted-foreground/30 text-muted-foreground"
                                )}>
                                  {m.status === "active" ? <Check className="w-2.5 h-2.5 mr-0.5" /> : <X className="w-2.5 h-2.5 mr-0.5" />}
                                  {m.status}
                                </Badge>
                              </td>
                              <td className="py-2.5 px-4 text-muted-foreground tabular-nums">{m.latency}</td>
                              <td className="py-2.5 px-4 text-muted-foreground tabular-nums">{m.cost}</td>
                              <td className="py-2.5 px-4 w-32">
                                {m.status === "active" ? (
                                  <div className="flex items-center gap-2">
                                    <div className="flex-1 h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                                      <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${m.load}%` }}
                                        transition={{ delay: 0.3, duration: 0.5 }}
                                        className={cn(
                                          "h-full rounded-full",
                                          m.load > 70 ? "bg-amber-500/70" : "bg-primary/60"
                                        )}
                                      />
                                    </div>
                                    <span className="text-muted-foreground tabular-nums w-7 text-right">{m.load}%</span>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground/40">—</span>
                                )}
                              </td>
                            </motion.tr>
                          ))}
                        </tbody>
                      </table>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </TabsContent>

        {/* ── Load Balancing Tab ── */}
        <TabsContent value="balancing" className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {lbStrategies.map((s, i) => (
              <motion.div
                key={s.name}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className={cn(
                  "glass-panel p-4 glow-border flex items-center gap-4 cursor-pointer transition-colors",
                  s.active ? "ring-1 ring-primary/40" : "opacity-60 hover:opacity-80"
                )}
              >
                <div className={cn(
                  "h-10 w-10 rounded-lg flex items-center justify-center",
                  s.active ? "bg-primary/15" : "bg-secondary/30"
                )}>
                  <s.icon className={cn("h-5 w-5", s.active ? "text-primary" : "text-muted-foreground")} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{s.name}</span>
                    {s.active && <Badge className="text-[8px] bg-primary/20 text-primary border-0">Active</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{s.desc}</p>
                </div>
                <Settings2 className="h-4 w-4 text-muted-foreground/40" />
              </motion.div>
            ))}
          </div>

          {/* Load distribution visualization */}
          <div className="glass-panel p-4 glow-border">
            <h3 className="text-sm font-medium text-foreground mb-4 flex items-center gap-2">
              <Gauge className="w-4 h-4" /> Current Load Distribution
            </h3>
            <div className="space-y-2.5">
              {[
                { provider: "OpenAI", pct: 34, color: "bg-emerald-500/60" },
                { provider: "Google", pct: 22, color: "bg-blue-500/60" },
                { provider: "Anthropic", pct: 18, color: "bg-purple-500/60" },
                { provider: "ElevenLabs", pct: 9, color: "bg-amber-500/60" },
                { provider: "Runway", pct: 6, color: "bg-red-500/60" },
                { provider: "Others", pct: 11, color: "bg-muted-foreground/40" },
              ].map((p) => (
                <div key={p.provider} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">{p.provider}</span>
                    <span className="text-foreground tabular-nums">{p.pct}%</span>
                  </div>
                  <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${p.pct}%` }}
                      transition={{ delay: 0.2, duration: 0.6 }}
                      className={cn("h-full rounded-full", p.color)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        {/* ── Live Health Tab ── */}
        <TabsContent value="health">
          <div className="glass-panel glow-border divide-y divide-border/30">
            {healthFeed.map((e, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="flex items-center gap-3 px-4 py-3"
              >
                <div className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  e.ok ? "bg-emerald-400" : "bg-amber-400"
                )} />
                <span className="text-xs text-foreground flex-1">{e.msg}</span>
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0">{e.time}</span>
              </motion.div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
