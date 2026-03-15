import { motion } from "framer-motion";
import { Wrench, ChevronDown } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const tools = [
  { name: "image_generation", primary: "Flux", fallback: "Stable Diffusion XL", provider: "Replicate", status: "green", latency: "1.2s" },
  { name: "video_generation", primary: "Runway Gen3", fallback: "Pika Video", provider: "Runway", status: "green", latency: "8.4s" },
  { name: "voice_generation", primary: "ElevenLabs v2", fallback: "ElevenLabs v1", provider: "ElevenLabs", status: "yellow", latency: "0.8s" },
  { name: "document_analysis", primary: "GPT-4o", fallback: "Claude 3.5", provider: "OpenAI", status: "green", latency: "2.1s" },
  { name: "vision_analysis", primary: "GPT-4o Vision", fallback: "Gemini 1.5 Pro", provider: "OpenAI", status: "red", latency: "3.5s" },
];

const statusColors: Record<string, string> = { green: "bg-emerald-400", yellow: "bg-amber-400", red: "bg-red-400" };

export default function Tools() {
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-semibold text-foreground">AI Tool Router</h1><p className="text-sm text-muted-foreground mt-1">Configure routing rules for AI tools and models</p></div>
      <div className="glass-panel glow-border overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border/50">{["Tool", "Status", "Primary Model", "Fallback", "Provider", "Latency"].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {tools.map((t, i) => (
              <motion.tr key={t.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border/30 hover:bg-accent/30 transition-colors">
                <td className="py-3 px-4 font-mono text-foreground">{t.name}</td>
                <td className="py-3 px-4"><div className={`h-2 w-2 rounded-full ${statusColors[t.status]}`} /></td>
                <td className="py-3 px-4"><Select defaultValue={t.primary}><SelectTrigger className="h-7 w-40 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value={t.primary}>{t.primary}</SelectItem></SelectContent></Select></td>
                <td className="py-3 px-4 text-muted-foreground">{t.fallback}</td>
                <td className="py-3 px-4"><Badge variant="outline" className="text-[9px]">{t.provider}</Badge></td>
                <td className="py-3 px-4 text-muted-foreground tabular-nums">{t.latency}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
