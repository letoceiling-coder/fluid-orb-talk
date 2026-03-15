import { motion } from "framer-motion";
import { Activity, Bot, Cpu, DollarSign, ArrowUpRight, MessageSquare, Image, Zap } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { Link } from "react-router-dom";

const stats = [
  { label: "Total Requests", value: "1.2M", change: "+12.5%", icon: Activity },
  { label: "Active Models", value: "14", change: "+2", icon: Cpu },
  { label: "Tokens Used", value: "847K", change: "+8.3%", icon: Bot },
  { label: "Total Cost", value: "$2,847", change: "-3.1%", icon: DollarSign },
];

const chartData = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  requests: Math.floor(Math.random() * 5000 + 20000 + Math.sin(i / 3) * 8000),
  tokens: Math.floor(Math.random() * 3000 + 15000 + Math.cos(i / 4) * 5000),
}));

const quickLinks = [
  { title: "AI Studio", desc: "Chat with AI models", icon: MessageSquare, url: "/ai-studio", color: "from-blue-500/20 to-blue-600/5" },
  { title: "Media Studio", desc: "Generate images & video", icon: Image, url: "/media-studio", color: "from-purple-500/20 to-purple-600/5" },
  { title: "Agents", desc: "Build AI agents", icon: Bot, url: "/agents", color: "from-emerald-500/20 to-emerald-600/5" },
  { title: "Gateway Pro", desc: "Pipeline orchestration", icon: Zap, url: "/gateway-pro", color: "from-amber-500/20 to-amber-600/5" },
];

const activity = [
  { action: "Image generated", model: "Flux", time: "2 min ago" },
  { action: "Chat completed", model: "GPT-4o", time: "5 min ago" },
  { action: "Video rendered", model: "Runway Gen3", time: "12 min ago" },
  { action: "Agent executed", model: "Claude 3.5", time: "18 min ago" },
  { action: "Voice synthesized", model: "ElevenLabs", time: "25 min ago" },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.3 } } };

export default function Dashboard() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-1">AI Gateway Platform overview</p>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s) => (
          <motion.div key={s.label} variants={item} className="glass-panel p-4 glow-border">
            <div className="flex items-center justify-between mb-3">
              <s.icon className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs text-emerald-400 flex items-center gap-0.5">
                {s.change} <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <div className="text-2xl font-semibold text-foreground tabular-nums">{s.value}</div>
            <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <motion.div variants={item} initial="hidden" animate="show" className="lg:col-span-2 glass-panel p-5 glow-border">
          <h2 className="text-sm font-medium text-foreground mb-4">Usage Trends</h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillReq" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(217, 91%, 60%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 16%)" />
                <XAxis dataKey="day" tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: "hsl(240, 10%, 8%)", border: "1px solid hsl(240, 4%, 16%)", borderRadius: 8, fontSize: 12, color: "hsl(0, 0%, 98%)" }} />
                <Area type="monotone" dataKey="requests" stroke="hsl(217, 91%, 60%)" fill="url(#fillReq)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={item} initial="hidden" animate="show" className="glass-panel p-5 glow-border">
          <h2 className="text-sm font-medium text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {activity.map((a, i) => (
              <div key={i} className="flex items-center justify-between text-xs">
                <div>
                  <span className="text-foreground">{a.action}</span>
                  <span className="text-muted-foreground ml-1.5">· {a.model}</span>
                </div>
                <span className="text-muted-foreground/60">{a.time}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickLinks.map((q) => (
          <motion.div key={q.title} variants={item}>
            <Link to={q.url} className={`glass-panel p-4 glow-border block group hover:border-primary/30 transition-colors bg-gradient-to-br ${q.color}`}>
              <q.icon className="h-5 w-5 text-foreground mb-3" />
              <div className="text-sm font-medium text-foreground">{q.title}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{q.desc}</div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
