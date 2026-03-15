import { motion } from "framer-motion";
import { Layers, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const modelGroups = [
  { provider: "OpenAI", models: [
    { name: "GPT-4o", type: "Chat", context: "128K", status: "Available" },
    { name: "GPT-4 Turbo", type: "Chat", context: "128K", status: "Available" },
    { name: "DALL·E 3", type: "Image", context: "—", status: "Available" },
    { name: "Whisper", type: "Audio", context: "—", status: "Available" },
  ]},
  { provider: "Anthropic", models: [
    { name: "Claude 3.5 Sonnet", type: "Chat", context: "200K", status: "Available" },
    { name: "Claude 3 Opus", type: "Chat", context: "200K", status: "Available" },
  ]},
  { provider: "Google", models: [
    { name: "Gemini 1.5 Pro", type: "Chat", context: "2M", status: "Available" },
    { name: "Gemini 1.5 Flash", type: "Chat", context: "1M", status: "Available" },
  ]},
  { provider: "Media", models: [
    { name: "Flux", type: "Image", context: "—", status: "Available" },
    { name: "Stable Diffusion XL", type: "Image", context: "—", status: "Available" },
    { name: "Runway Gen3", type: "Video", context: "—", status: "Beta" },
    { name: "ElevenLabs v2", type: "Audio", context: "—", status: "Available" },
  ]},
];

const typeColors: Record<string, string> = { Chat: "bg-blue-500/10 text-blue-400", Image: "bg-purple-500/10 text-purple-400", Video: "bg-emerald-500/10 text-emerald-400", Audio: "bg-amber-500/10 text-amber-400" };

export default function Models() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-foreground">Models</h1><p className="text-sm text-muted-foreground mt-1">Browse available AI models</p></div>
        <div className="flex items-center gap-2 rounded-lg bg-secondary/50 px-3 py-1.5"><Search className="h-3.5 w-3.5 text-muted-foreground" /><input className="bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none w-40" placeholder="Search models..." /></div>
      </div>
      {modelGroups.map((g) => (
        <motion.div key={g.provider} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{g.provider}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {g.models.map(m => (
              <div key={m.name} className="glass-panel p-4 glow-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2 mb-2"><Layers className="h-4 w-4 text-muted-foreground" /><span className="text-sm font-medium text-foreground">{m.name}</span></div>
                <div className="flex items-center gap-2"><Badge className={`text-[9px] border-0 ${typeColors[m.type]}`}>{m.type}</Badge>{m.context !== "—" && <span className="text-[10px] text-muted-foreground">{m.context} ctx</span>}<Badge variant={m.status === "Available" ? "default" : "secondary"} className="text-[9px] h-4 ml-auto">{m.status}</Badge></div>
              </div>
            ))}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
