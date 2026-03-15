import { useState } from "react";
import { motion } from "framer-motion";
import { Send, Paperclip, Mic, Camera, Plus, Search, Settings2, ChevronDown, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const conversations = [
  { id: 1, title: "Code Review Assistant", time: "2 min ago", active: true },
  { id: 2, title: "API Design Discussion", time: "1 hour ago", active: false },
  { id: 3, title: "Data Pipeline Planning", time: "3 hours ago", active: false },
  { id: 4, title: "Marketing Copy", time: "Yesterday", active: false },
  { id: 5, title: "Research Summary", time: "2 days ago", active: false },
];

const messages = [
  { role: "user", content: "Explain the differences between REST and GraphQL APIs for a high-traffic application." },
  { role: "assistant", content: "Great question! Here's a comprehensive comparison:\n\n**REST API:**\n- Uses multiple endpoints for different resources\n- Returns fixed data structures\n- Better caching with HTTP standards\n- Simpler to implement and understand\n\n**GraphQL:**\n- Single endpoint for all queries\n- Client specifies exact data needed\n- Reduces over-fetching and under-fetching\n- Built-in type system and introspection\n\nFor high-traffic applications, consider:\n- REST is better when you need aggressive caching\n- GraphQL excels when clients need flexible data requirements\n- Many modern apps use both: REST for simple CRUD, GraphQL for complex queries" },
  { role: "user", content: "What about performance considerations at scale?" },
];

export default function AIStudio() {
  const [prompt, setPrompt] = useState("");
  const [model, setModel] = useState("gpt-4o");
  const [temperature, setTemperature] = useState([0.7]);
  const [maxTokens, setMaxTokens] = useState([4096]);
  const [topP, setTopP] = useState([1.0]);

  return (
    <div className="flex h-[calc(100vh-3rem)]">
      {/* Left - Conversations */}
      <div className="w-72 border-r border-border/50 flex flex-col shrink-0 hidden lg:flex">
        <div className="p-3 space-y-2">
          <Button variant="outline" className="w-full justify-start gap-2 text-xs h-9 bg-secondary/30 border-border/50">
            <Plus className="h-3.5 w-3.5" /> New Conversation
          </Button>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input className="w-full h-8 pl-8 pr-3 rounded-md bg-secondary/30 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="Search conversations..." />
          </div>
        </div>
        <div className="flex-1 overflow-auto scrollbar-thin px-2 space-y-0.5">
          {conversations.map((c) => (
            <button key={c.id} className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-colors ${c.active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"}`}>
              <div className="font-medium truncate">{c.title}</div>
              <div className="text-[10px] text-muted-foreground/60 mt-0.5">{c.time}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Center - Chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-11 border-b border-border/50 flex items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-medium text-foreground">Code Review Assistant</h2>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{model}</span>
          </div>
        </div>

        <div className="flex-1 overflow-auto scrollbar-thin p-4 space-y-4">
          {messages.map((m, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className={`flex gap-3 ${m.role === "user" ? "justify-end" : ""}`}>
              {m.role === "assistant" && (
                <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="h-3.5 w-3.5 text-primary" />
                </div>
              )}
              <div className={`max-w-2xl rounded-xl px-4 py-3 text-sm leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground" : "glass-panel text-foreground"}`}>
                <pre className="whitespace-pre-wrap font-sans">{m.content}</pre>
              </div>
              {m.role === "user" && (
                <div className="h-7 w-7 rounded-lg bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                  <User className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
            </motion.div>
          ))}
        </div>

        <div className="p-4 border-t border-border/50">
          <div className="glass-panel p-2 flex items-end gap-2">
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Paperclip className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Mic className="h-4 w-4" /></Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground"><Camera className="h-4 w-4" /></Button>
            </div>
            <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="Send a message..." className="min-h-[40px] max-h-32 resize-none border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-sm" rows={1} />
            <Button size="icon" className="h-8 w-8 shrink-0"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>

      {/* Right - Config */}
      <div className="w-80 border-l border-border/50 p-4 space-y-5 overflow-auto scrollbar-thin shrink-0 hidden xl:block">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-foreground flex items-center gap-2">
            <Settings2 className="h-4 w-4" /> Configuration
          </h3>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Model</label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="h-9 bg-secondary/30 border-border/50 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                <SelectItem value="claude-3.5-sonnet">Claude 3.5 Sonnet</SelectItem>
                <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                <SelectItem value="gemini-1.5-pro">Gemini 1.5 Pro</SelectItem>
                <SelectItem value="gemini-1.5-flash">Gemini 1.5 Flash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Temperature</label>
              <span className="text-xs text-foreground tabular-nums">{temperature[0]}</span>
            </div>
            <Slider value={temperature} onValueChange={setTemperature} min={0} max={2} step={0.1} className="py-1" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Max Tokens</label>
              <span className="text-xs text-foreground tabular-nums">{maxTokens[0]}</span>
            </div>
            <Slider value={maxTokens} onValueChange={setMaxTokens} min={256} max={16384} step={256} className="py-1" />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-xs text-muted-foreground">Top P</label>
              <span className="text-xs text-foreground tabular-nums">{topP[0]}</span>
            </div>
            <Slider value={topP} onValueChange={setTopP} min={0} max={1} step={0.05} className="py-1" />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">System Prompt</label>
            <Textarea className="min-h-[100px] bg-secondary/30 border-border/50 text-xs resize-none" placeholder="You are a helpful assistant..." />
          </div>
        </div>
      </div>
    </div>
  );
}
