import { motion } from "framer-motion";
import { Activity, AlertTriangle, Clock, Server } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Badge } from "@/components/ui/badge";

const latencyData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  gpt4o: Math.floor(Math.random() * 200 + 400),
  claude: Math.floor(Math.random() * 150 + 350),
  gemini: Math.floor(Math.random() * 100 + 300),
}));

const queueJobs = [
  { id: "job_001", type: "Video Generation", status: "Processing", duration: "2m 34s" },
  { id: "job_002", type: "Image Generation", status: "Queued", duration: "—" },
  { id: "job_003", type: "Voice Synthesis", status: "Complete", duration: "12s" },
  { id: "job_004", type: "Data Analysis", status: "Complete", duration: "45s" },
];

const statusColor: Record<string, string> = { Processing: "text-amber-400", Queued: "text-muted-foreground", Complete: "text-emerald-400" };

export default function Monitoring() {
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-semibold text-foreground">Monitoring</h1><p className="text-sm text-muted-foreground mt-1">System performance and health metrics</p></div>

      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[{ label: "Avg Latency", value: "423ms", icon: Clock }, { label: "Error Rate", value: "0.12%", icon: AlertTriangle }, { label: "Uptime", value: "99.97%", icon: Server }, { label: "Active Jobs", value: "2", icon: Activity }].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 glow-border">
            <s.icon className="h-4 w-4 text-muted-foreground mb-2" />
            <div className="text-xl font-semibold text-foreground tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel p-5 glow-border">
        <h2 className="text-sm font-medium text-foreground mb-4">Model Latency (24h)</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={latencyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 16%)" />
              <XAxis dataKey="hour" tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(240, 10%, 8%)", border: "1px solid hsl(240, 4%, 16%)", borderRadius: 8, fontSize: 11, color: "hsl(0, 0%, 98%)" }} />
              <Area type="monotone" dataKey="gpt4o" stroke="hsl(217, 91%, 60%)" fill="hsl(217, 91%, 60%)" fillOpacity={0.1} strokeWidth={1.5} />
              <Area type="monotone" dataKey="claude" stroke="hsl(280, 65%, 60%)" fill="hsl(280, 65%, 60%)" fillOpacity={0.1} strokeWidth={1.5} />
              <Area type="monotone" dataKey="gemini" stroke="hsl(150, 60%, 50%)" fill="hsl(150, 60%, 50%)" fillOpacity={0.1} strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex gap-4 mt-3">{[{ name: "GPT-4o", color: "bg-blue-500" }, { name: "Claude", color: "bg-purple-500" }, { name: "Gemini", color: "bg-emerald-500" }].map(l => <div key={l.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground"><div className={`h-2 w-2 rounded-full ${l.color}`} />{l.name}</div>)}</div>
      </div>

      <div className="glass-panel glow-border overflow-hidden">
        <h2 className="text-sm font-medium text-foreground p-4 pb-0">Queue Jobs</h2>
        <table className="w-full text-xs mt-3">
          <thead><tr className="border-b border-border/50">{["Job ID", "Type", "Status", "Duration"].map(h => <th key={h} className="text-left py-2 px-4 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
          <tbody>{queueJobs.map(j => <tr key={j.id} className="border-b border-border/30"><td className="py-2.5 px-4 font-mono text-muted-foreground">{j.id}</td><td className="py-2.5 px-4 text-foreground">{j.type}</td><td className={`py-2.5 px-4 ${statusColor[j.status]}`}>{j.status}</td><td className="py-2.5 px-4 text-muted-foreground tabular-nums">{j.duration}</td></tr>)}</tbody>
        </table>
      </div>

      <div className="glass-panel p-4 glow-border">
        <div className="flex items-center gap-3"><div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center"><Activity className="h-4 w-4 text-primary" /></div><div><div className="text-sm font-medium text-foreground">Sentry Integration</div><div className="text-xs text-muted-foreground">Connected · Last event 3 min ago</div></div><Badge className="ml-auto text-[9px]">Active</Badge></div>
      </div>
    </div>
  );
}
