import { motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, BarChart, Bar } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const dailyData = Array.from({ length: 14 }, (_, i) => ({
  day: `Mar ${i + 1}`,
  tokens: Math.floor(Math.random() * 50000 + 80000),
  cost: +(Math.random() * 50 + 100).toFixed(2),
}));

const modelData = [
  { model: "GPT-4o", tokens: 320000, cost: 1280 },
  { model: "Claude 3.5", tokens: 180000, cost: 720 },
  { model: "Gemini Pro", tokens: 95000, cost: 285 },
  { model: "Flux", tokens: 45000, cost: 450 },
  { model: "ElevenLabs", tokens: 12000, cost: 120 },
];

export default function Usage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-foreground">Usage & Billing</h1><p className="text-sm text-muted-foreground mt-1">Monitor your API usage and costs</p></div>
        <Button variant="outline" className="text-xs h-9">Manage Billing</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[{ label: "Current Period", value: "$2,847.00", sub: "Mar 1 - Mar 15" }, { label: "Total Tokens", value: "652K", sub: "+12% from last period" }, { label: "Plan", value: "Pro", sub: "$299/month" }].map(s => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-panel p-4 glow-border">
            <div className="text-xs text-muted-foreground">{s.label}</div>
            <div className="text-xl font-semibold text-foreground mt-1 tabular-nums">{s.value}</div>
            <div className="text-[10px] text-muted-foreground/60 mt-0.5">{s.sub}</div>
          </motion.div>
        ))}
      </div>

      <div className="glass-panel p-5 glow-border">
        <h2 className="text-sm font-medium text-foreground mb-4">Daily Token Usage</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dailyData}>
              <defs><linearGradient id="fillTokens" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} /><stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} /></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 16%)" />
              <XAxis dataKey="day" tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: "hsl(240, 10%, 8%)", border: "1px solid hsl(240, 4%, 16%)", borderRadius: 8, fontSize: 11, color: "hsl(0, 0%, 98%)" }} />
              <Area type="monotone" dataKey="tokens" stroke="hsl(217, 91%, 60%)" fill="url(#fillTokens)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-panel glow-border overflow-hidden">
        <h2 className="text-sm font-medium text-foreground p-4 pb-0">Cost by Model</h2>
        <table className="w-full text-xs mt-3">
          <thead><tr className="border-b border-border/50">{["Model", "Tokens Used", "Cost", "% of Total"].map(h => <th key={h} className="text-left py-2 px-4 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {modelData.map(m => (
              <tr key={m.model} className="border-b border-border/30">
                <td className="py-2.5 px-4 text-foreground">{m.model}</td>
                <td className="py-2.5 px-4 text-muted-foreground tabular-nums">{m.tokens.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-foreground tabular-nums">${m.cost.toLocaleString()}</td>
                <td className="py-2.5 px-4"><div className="w-24 h-1.5 bg-secondary/50 rounded-full"><div className="h-full bg-primary rounded-full" style={{ width: `${(m.cost / 2855) * 100}%` }} /></div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
