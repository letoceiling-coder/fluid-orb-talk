import { useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight, User, Wrench, Library, Server, Activity, Clock, DollarSign,
  AlertTriangle, TrendingUp, Zap, Shield, BarChart3, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

// ─── Provider data ───
const providers = [
  { name: "OpenAI", models: ["GPT-5", "GPT-5 Mini"], requests: 12847, latency: "1.1s", errorRate: "0.3%", cost: "$284.20", status: "green" },
  { name: "Gemini", models: ["Gemini 2.5 Pro", "Gemini 3 Flash"], requests: 9432, latency: "0.9s", errorRate: "0.1%", cost: "$156.80", status: "green" },
  { name: "Anthropic", models: ["Claude 4 Sonnet", "Claude 4 Haiku"], requests: 6215, latency: "1.3s", errorRate: "0.5%", cost: "$198.40", status: "green" },
  { name: "Replicate", models: ["Flux Pro", "SDXL"], requests: 3841, latency: "5.2s", errorRate: "1.2%", cost: "$89.60", status: "yellow" },
  { name: "Runway", models: ["Gen-3 Alpha"], requests: 1247, latency: "28s", errorRate: "2.1%", cost: "$312.50", status: "green" },
  { name: "Pika", models: ["Pika 2.0"], requests: 892, latency: "18s", errorRate: "1.8%", cost: "$134.10", status: "yellow" },
  { name: "Luma", models: ["Ray 2"], requests: 634, latency: "22s", errorRate: "0.9%", cost: "$178.30", status: "green" },
  { name: "ElevenLabs", models: ["V3", "V2"], requests: 4521, latency: "0.8s", errorRate: "0.2%", cost: "$67.90", status: "green" },
];

const routingRules = [
  { from: "Text queries", primary: "GPT-5", fallback: "Claude 4 Sonnet", strategy: "Lowest latency", active: true },
  { from: "Complex reasoning", primary: "Gemini 2.5 Pro", fallback: "GPT-5", strategy: "Best quality", active: true },
  { from: "Image generation", primary: "Flux Pro", fallback: "SDXL", strategy: "Cost optimized", active: true },
  { from: "Video generation", primary: "Gen-3 Alpha", fallback: "Pika 2.0", strategy: "Quality first", active: true },
  { from: "Voice synthesis", primary: "ElevenLabs V3", fallback: "ElevenLabs V2", strategy: "Lowest latency", active: true },
  { from: "Quick tasks", primary: "GPT-5 Mini", fallback: "Gemini 3 Flash", strategy: "Cost optimized", active: false },
];

const pipelineSteps = [
  { label: "User Request", icon: User, color: "from-blue-500/20 to-blue-600/5" },
  { label: "Tool Router", icon: Wrench, color: "from-amber-500/20 to-amber-600/5" },
  { label: "Model Hub", icon: Library, color: "from-purple-500/20 to-purple-600/5" },
  { label: "Provider", icon: Server, color: "from-emerald-500/20 to-emerald-600/5" },
];

const statusColors: Record<string, string> = { green: "bg-emerald-400", yellow: "bg-amber-400", red: "bg-red-400" };

const stats = [
  { label: "Total Requests", value: "39,629", icon: Activity, trend: "+12%" },
  { label: "Avg Latency", value: "1.4s", icon: Clock, trend: "-8%" },
  { label: "Error Rate", value: "0.7%", icon: AlertTriangle, trend: "-23%" },
  { label: "Total Cost", value: "$1,421.80", icon: DollarSign, trend: "+5%" },
];

export default function AISuperRouter() {
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">AI Super Router</h1>
          <p className="text-sm text-muted-foreground mt-1">Intelligent model routing with fallback & cost optimization</p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs"><Zap className="w-3 h-3" />8 Providers Active</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="glass-panel p-4 glow-border">
            <div className="flex items-center justify-between mb-2">
              <s.icon className="w-4 h-4 text-muted-foreground" />
              <span className={cn("text-[10px] font-medium", s.trend.startsWith("-") ? "text-emerald-400" : "text-amber-400")}>{s.trend}</span>
            </div>
            <div className="text-lg font-semibold text-foreground tabular-nums">{s.value}</div>
            <div className="text-[11px] text-muted-foreground">{s.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Pipeline Visualization */}
      <div className="glass-panel p-6 glow-border">
        <h2 className="text-sm font-medium text-foreground mb-6 text-center">Request Pipeline</h2>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-3">
          {pipelineSteps.map((step, i) => (
            <motion.div key={step.label} className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}>
              <div className={cn("glass-panel p-5 glow-border bg-gradient-to-br flex flex-col items-center gap-2 min-w-[130px]", step.color)}>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}>
                  <step.icon className="h-6 w-6 text-foreground" />
                </motion.div>
                <span className="text-xs font-medium text-foreground">{step.label}</span>
              </div>
              {i < pipelineSteps.length - 1 && (
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}>
                  <ArrowRight className="h-4 w-4 text-primary hidden lg:block" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="providers" className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/50">
          <TabsTrigger value="providers" className="text-xs gap-1.5"><Server className="h-3.5 w-3.5" />Providers</TabsTrigger>
          <TabsTrigger value="routing" className="text-xs gap-1.5"><RefreshCw className="h-3.5 w-3.5" />Routing Rules</TabsTrigger>
          <TabsTrigger value="costs" className="text-xs gap-1.5"><DollarSign className="h-3.5 w-3.5" />Cost Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="providers">
          <div className="glass-panel glow-border overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border/50">
                  {["Provider", "Status", "Models", "Requests", "Latency", "Error Rate", "Cost"].map(h => (
                    <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {providers.map((p, i) => (
                  <motion.tr key={p.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="border-b border-border/30 hover:bg-accent/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedProvider(p.name === selectedProvider ? null : p.name)}>
                    <td className="py-3 px-4 font-medium text-foreground">{p.name}</td>
                    <td className="py-3 px-4"><div className={cn("h-2 w-2 rounded-full", statusColors[p.status])} /></td>
                    <td className="py-3 px-4 text-muted-foreground">{p.models.join(", ")}</td>
                    <td className="py-3 px-4 text-foreground tabular-nums">{p.requests.toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground tabular-nums">{p.latency}</td>
                    <td className="py-3 px-4">
                      <span className={cn("tabular-nums", parseFloat(p.errorRate) > 1 ? "text-amber-400" : "text-emerald-400")}>{p.errorRate}</span>
                    </td>
                    <td className="py-3 px-4 text-foreground tabular-nums">{p.cost}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="routing">
          <div className="space-y-3">
            {routingRules.map((rule, i) => (
              <motion.div key={rule.from} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className={cn("glass-panel p-4 glow-border flex items-center gap-4", !rule.active && "opacity-50")}>
                <div className="flex-1">
                  <div className="text-xs font-medium text-foreground">{rule.from}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">
                    {rule.primary} → <span className="text-muted-foreground/60">{rule.fallback}</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-[9px]">
                  {rule.strategy === "Cost optimized" && <DollarSign className="w-2.5 h-2.5 mr-0.5" />}
                  {rule.strategy === "Lowest latency" && <Clock className="w-2.5 h-2.5 mr-0.5" />}
                  {rule.strategy === "Best quality" && <TrendingUp className="w-2.5 h-2.5 mr-0.5" />}
                  {rule.strategy === "Quality first" && <Shield className="w-2.5 h-2.5 mr-0.5" />}
                  {rule.strategy}
                </Badge>
                <div className={cn("h-2 w-2 rounded-full", rule.active ? "bg-emerald-400" : "bg-muted-foreground/30")} />
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="costs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4 glow-border space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2"><DollarSign className="w-4 h-4" />Cost by Provider</h3>
              {providers.sort((a, b) => parseFloat(b.cost.replace("$", "")) - parseFloat(a.cost.replace("$", ""))).map(p => {
                const cost = parseFloat(p.cost.replace("$", "").replace(",", ""));
                const maxCost = 312.5;
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="text-foreground tabular-nums">{p.cost}</span>
                    </div>
                    <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(cost / maxCost) * 100}%` }}
                        transition={{ delay: 0.3, duration: 0.6 }} className="h-full bg-primary/60 rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="glass-panel p-4 glow-border space-y-3">
              <h3 className="text-sm font-medium text-foreground flex items-center gap-2"><BarChart3 className="w-4 h-4" />Request Volume</h3>
              {providers.sort((a, b) => b.requests - a.requests).map(p => {
                const maxReqs = 12847;
                return (
                  <div key={p.name} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{p.name}</span>
                      <span className="text-foreground tabular-nums">{p.requests.toLocaleString()}</span>
                    </div>
                    <div className="h-1.5 bg-secondary/30 rounded-full overflow-hidden">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${(p.requests / maxReqs) * 100}%` }}
                        transition={{ delay: 0.3, duration: 0.6 }} className="h-full bg-emerald-500/60 rounded-full" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
