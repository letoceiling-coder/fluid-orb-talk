import { motion } from "framer-motion";
import { Zap, User, Wrench, Bot, Image, Server, ArrowRight } from "lucide-react";

const pipelineNodes = [
  { label: "User Input", icon: User, color: "from-blue-500/20 to-blue-600/5" },
  { label: "Tool Router", icon: Wrench, color: "from-amber-500/20 to-amber-600/5" },
  { label: "Agent Engine", icon: Bot, color: "from-purple-500/20 to-purple-600/5" },
  { label: "Media Pipeline", icon: Image, color: "from-emerald-500/20 to-emerald-600/5" },
  { label: "Model Provider", icon: Server, color: "from-red-500/20 to-red-600/5" },
];

export default function GatewayPro() {
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-semibold text-foreground">AI Gateway Pro</h1><p className="text-sm text-muted-foreground mt-1">Core architecture and pipeline orchestration</p></div>

      <div className="glass-panel p-8 glow-border">
        <h2 className="text-sm font-medium text-foreground mb-8 text-center">Request Pipeline</h2>
        <div className="flex flex-col lg:flex-row items-center justify-center gap-3">
          {pipelineNodes.map((node, i) => (
            <motion.div key={node.label} className="flex items-center gap-3" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.15 }}>
              <div className={`glass-panel p-5 glow-border bg-gradient-to-br ${node.color} flex flex-col items-center gap-2 min-w-[120px]`}>
                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ repeat: Infinity, duration: 2, delay: i * 0.3 }}>
                  <node.icon className="h-6 w-6 text-foreground" />
                </motion.div>
                <span className="text-xs font-medium text-foreground">{node.label}</span>
              </div>
              {i < pipelineNodes.length - 1 && (
                <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}>
                  <ArrowRight className="h-4 w-4 text-primary hidden lg:block" />
                </motion.div>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-panel p-4 glow-border space-y-3">
          <h3 className="text-sm font-medium text-foreground">Routing Rules</h3>
          {[{ rule: "Text queries → GPT-4o (primary) → Claude 3.5 (fallback)", active: true }, { rule: "Image tasks → Flux (primary) → SDXL (fallback)", active: true }, { rule: "Video tasks → Runway Gen3 (primary) → Pika (fallback)", active: false }].map(r => (
            <div key={r.rule} className="flex items-center gap-2 text-xs">
              <div className={`h-1.5 w-1.5 rounded-full ${r.active ? "bg-emerald-400" : "bg-muted-foreground/30"}`} />
              <span className="text-muted-foreground">{r.rule}</span>
            </div>
          ))}
        </div>
        <div className="glass-panel p-4 glow-border space-y-3">
          <h3 className="text-sm font-medium text-foreground">Pipeline Stats</h3>
          {[{ label: "Avg. Pipeline Latency", value: "1.2s" }, { label: "Success Rate", value: "99.8%" }, { label: "Fallback Triggers", value: "23 today" }, { label: "Active Routes", value: "12" }].map(s => (
            <div key={s.label} className="flex items-center justify-between text-xs"><span className="text-muted-foreground">{s.label}</span><span className="text-foreground tabular-nums">{s.value}</span></div>
          ))}
        </div>
      </div>
    </div>
  );
}
