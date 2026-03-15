import { motion } from "framer-motion";
import { Bot, Plus, Eye, Globe, Code, Image, Video, Zap, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const agents = [
  { name: "Marketing Agent", status: "Active", capabilities: ["Vision", "Code", "Browsing"], desc: "Generates marketing campaigns, analyzes competitors" },
  { name: "Video Creator", status: "Active", capabilities: ["Vision", "Video", "Image"], desc: "Creates and edits video content from prompts" },
  { name: "Research Agent", status: "Idle", capabilities: ["Browsing", "Analytics"], desc: "Deep web research with source verification" },
  { name: "Data Analyst", status: "Idle", capabilities: ["Code", "Analytics"], desc: "Analyzes datasets and generates reports" },
];

const capIcons: Record<string, any> = { Vision: Eye, Browsing: Globe, Code: Code, Image: Image, Video: Video, Analytics: BarChart3 };

export default function Agents() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-foreground">AI Agents</h1><p className="text-sm text-muted-foreground mt-1">Build and manage autonomous AI agents</p></div>
        <Dialog>
          <DialogTrigger asChild><Button className="gap-2 text-xs h-9"><Plus className="h-3.5 w-3.5" /> New Agent</Button></DialogTrigger>
          <DialogContent className="glass-panel-strong border-border/50 max-w-lg">
            <DialogHeader><DialogTitle className="text-foreground">Create Agent</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Agent Name</label><input className="w-full h-9 px-3 rounded-md bg-secondary/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="My Agent" /></div>
              <div className="space-y-1.5"><label className="text-xs text-muted-foreground">System Prompt</label><Textarea className="min-h-[100px] bg-secondary/30 border-border/50 text-xs" placeholder="You are a helpful agent that..." /></div>
              <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Capabilities</label>
                <div className="flex flex-wrap gap-2">{["Image Generation", "Video Generation", "Data Analysis", "Web Search", "Code Execution"].map(c => <Badge key={c} variant="outline" className="text-[10px] cursor-pointer hover:bg-primary/10 hover:border-primary/30">{c}</Badge>)}</div>
              </div>
              <div className="flex items-center justify-between"><label className="text-xs text-muted-foreground">Memory Enabled</label><Switch /></div>
              <Button className="w-full text-xs h-9">Create Agent</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {agents.map((a, i) => (
          <motion.div key={a.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel p-4 glow-border hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><Bot className="h-5 w-5 text-primary" /></div>
              <div><div className="text-sm font-medium text-foreground">{a.name}</div><Badge variant={a.status === "Active" ? "default" : "secondary"} className="text-[9px] h-4 mt-0.5">{a.status}</Badge></div>
            </div>
            <p className="text-xs text-muted-foreground mb-3">{a.desc}</p>
            <div className="flex flex-wrap gap-1">{a.capabilities.map(c => { const Icon = capIcons[c] || Zap; return <Badge key={c} variant="outline" className="text-[9px] gap-1"><Icon className="h-2.5 w-2.5" />{c}</Badge>; })}</div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
