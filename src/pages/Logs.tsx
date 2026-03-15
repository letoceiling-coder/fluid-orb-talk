import { motion } from "framer-motion";
import { Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const logs = Array.from({ length: 20 }, (_, i) => ({
  id: `req_${(1000 + i).toString(36)}`,
  timestamp: `2026-03-15 ${String(12 + Math.floor(i / 4)).padStart(2, "0")}:${String((i * 3) % 60).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}`,
  method: ["POST", "GET", "POST", "POST"][i % 4],
  endpoint: ["/v1/chat/completions", "/v1/images/generations", "/v1/audio/speech", "/v1/embeddings"][i % 4],
  status: [200, 200, 200, 429, 200, 200, 500, 200][i % 8],
  latency: `${(Math.random() * 2000 + 200).toFixed(0)}ms`,
  model: ["gpt-4o", "flux", "elevenlabs-v2", "text-embedding-3"][i % 4],
}));

export default function Logs() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-foreground">Logs</h1><p className="text-sm text-muted-foreground mt-1">API request logs and debugging</p></div>
        <div className="flex gap-2">
          <Select defaultValue="all"><SelectTrigger className="h-8 w-28 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="200">200</SelectItem><SelectItem value="4xx">4xx</SelectItem><SelectItem value="5xx">5xx</SelectItem></SelectContent></Select>
          <Button variant="outline" className="text-xs h-8 gap-1.5"><Filter className="h-3.5 w-3.5" /> Filter</Button>
        </div>
      </div>
      <div className="glass-panel glow-border overflow-x-auto">
        <table className="w-full text-[11px] font-mono">
          <thead><tr className="border-b border-border/50">{["Timestamp", "Method", "Endpoint", "Status", "Model", "Latency"].map(h => <th key={h} className="text-left py-2.5 px-3 text-muted-foreground font-medium font-sans text-xs">{h}</th>)}</tr></thead>
          <tbody>
            {logs.map((l, i) => (
              <motion.tr key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="border-b border-border/20 hover:bg-accent/20 transition-colors">
                <td className="py-2 px-3 text-muted-foreground">{l.timestamp}</td>
                <td className="py-2 px-3"><Badge variant="outline" className="text-[9px] font-mono">{l.method}</Badge></td>
                <td className="py-2 px-3 text-foreground">{l.endpoint}</td>
                <td className="py-2 px-3"><span className={l.status === 200 ? "text-emerald-400" : l.status === 429 ? "text-amber-400" : "text-red-400"}>{l.status}</span></td>
                <td className="py-2 px-3 text-muted-foreground">{l.model}</td>
                <td className="py-2 px-3 text-muted-foreground tabular-nums">{l.latency}</td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
