import { useState } from "react";
import { motion } from "framer-motion";
import {
  Search, Filter, Star, Zap, Clock, DollarSign, Check, Settings2, X,
  MessageSquare, ImageIcon, Video, Mic, Eye, Hash,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

type Capability = "Text" | "Image" | "Video" | "Voice" | "Vision" | "Embeddings";
type Provider = "OpenAI" | "Google Gemini" | "Anthropic Claude" | "Replicate" | "Stability AI" | "Leonardo AI" | "Runway" | "Pika" | "Luma" | "ElevenLabs";

interface AIModel {
  id: string;
  name: string;
  provider: Provider;
  capabilities: Capability[];
  latency: string;
  cost: string;
  description: string;
  active: boolean;
  isDefault: boolean;
  params: Record<string, number>;
}

const capabilityIcons: Record<Capability, React.ElementType> = {
  Text: MessageSquare, Image: ImageIcon, Video, Voice: Mic, Vision: Eye, Embeddings: Hash,
};

const capabilityColors: Record<Capability, string> = {
  Text: "text-blue-400 bg-blue-500/10", Image: "text-purple-400 bg-purple-500/10",
  Video: "text-rose-400 bg-rose-500/10", Voice: "text-emerald-400 bg-emerald-500/10",
  Vision: "text-amber-400 bg-amber-500/10", Embeddings: "text-cyan-400 bg-cyan-500/10",
};

const providerColors: Record<string, string> = {
  "OpenAI": "from-emerald-500/20", "Google Gemini": "from-blue-500/20", "Anthropic Claude": "from-orange-500/20",
  "Replicate": "from-violet-500/20", "Stability AI": "from-indigo-500/20", "Leonardo AI": "from-pink-500/20",
  "Runway": "from-rose-500/20", "Pika": "from-yellow-500/20", "Luma": "from-cyan-500/20", "ElevenLabs": "from-teal-500/20",
};

const initialModels: AIModel[] = [
  { id: "gpt5", name: "GPT-5", provider: "OpenAI", capabilities: ["Text", "Vision", "Embeddings"], latency: "~1.2s", cost: "$0.03/1K", description: "Most capable reasoning model with multimodal support", active: true, isDefault: true, params: { temperature: 0.7, maxTokens: 4096 } },
  { id: "gpt5-mini", name: "GPT-5 Mini", provider: "OpenAI", capabilities: ["Text", "Vision"], latency: "~0.6s", cost: "$0.01/1K", description: "Fast and cost-effective for most tasks", active: true, isDefault: false, params: { temperature: 0.7, maxTokens: 2048 } },
  { id: "gemini-pro", name: "Gemini 2.5 Pro", provider: "Google Gemini", capabilities: ["Text", "Image", "Vision", "Embeddings"], latency: "~1.5s", cost: "$0.025/1K", description: "Top-tier multimodal with massive context window", active: true, isDefault: false, params: { temperature: 0.8, maxTokens: 8192 } },
  { id: "gemini-flash", name: "Gemini 3 Flash", provider: "Google Gemini", capabilities: ["Text", "Image", "Vision"], latency: "~0.3s", cost: "$0.005/1K", description: "Ultra-fast next-gen model for efficient tasks", active: false, isDefault: false, params: { temperature: 0.7, maxTokens: 4096 } },
  { id: "claude-4", name: "Claude 4 Sonnet", provider: "Anthropic Claude", capabilities: ["Text", "Vision"], latency: "~1.0s", cost: "$0.015/1K", description: "Excellent reasoning and safety alignment", active: true, isDefault: false, params: { temperature: 0.7, maxTokens: 4096 } },
  { id: "sdxl", name: "Stable Diffusion XL", provider: "Stability AI", capabilities: ["Image"], latency: "~4s", cost: "$0.002/img", description: "High-quality image generation with fine control", active: true, isDefault: false, params: { guidanceScale: 7.5, steps: 30, seed: -1 } },
  { id: "flux-pro", name: "Flux Pro", provider: "Replicate", capabilities: ["Image"], latency: "~6s", cost: "$0.005/img", description: "State-of-the-art photorealistic image generation", active: false, isDefault: false, params: { guidanceScale: 3.5, steps: 28, seed: -1 } },
  { id: "leonardo-phoenix", name: "Leonardo Phoenix", provider: "Leonardo AI", capabilities: ["Image"], latency: "~5s", cost: "$0.004/img", description: "Creative image generation with style control", active: false, isDefault: false, params: { guidanceScale: 7, steps: 25, seed: -1 } },
  { id: "runway-gen3", name: "Gen-3 Alpha", provider: "Runway", capabilities: ["Video", "Image"], latency: "~30s", cost: "$0.05/s", description: "Professional video generation from text and images", active: true, isDefault: false, params: { resolution: 1080, fps: 24, seed: -1 } },
  { id: "pika-v2", name: "Pika 2.0", provider: "Pika", capabilities: ["Video"], latency: "~20s", cost: "$0.03/s", description: "Creative video generation with motion control", active: false, isDefault: false, params: { resolution: 1080, fps: 24, seed: -1 } },
  { id: "luma-ray", name: "Luma Ray 2", provider: "Luma", capabilities: ["Video", "Vision"], latency: "~25s", cost: "$0.04/s", description: "Cinematic quality video with camera control", active: false, isDefault: false, params: { resolution: 1080, fps: 24, seed: -1 } },
  { id: "elevenlabs-v3", name: "ElevenLabs V3", provider: "ElevenLabs", capabilities: ["Voice"], latency: "~0.8s", cost: "$0.01/min", description: "Natural voice synthesis with emotion control", active: true, isDefault: false, params: { speed: 1.0, pitch: 1.0 } },
];

const allProviders: Provider[] = ["OpenAI", "Google Gemini", "Anthropic Claude", "Replicate", "Stability AI", "Leonardo AI", "Runway", "Pika", "Luma", "ElevenLabs"];
const allCapabilities: Capability[] = ["Text", "Image", "Video", "Voice", "Vision", "Embeddings"];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.25 } } };

export default function AIModelHub() {
  const [models, setModels] = useState(initialModels);
  const [search, setSearch] = useState("");
  const [selectedProviders, setSelectedProviders] = useState<Provider[]>([]);
  const [selectedCapabilities, setSelectedCapabilities] = useState<Capability[]>([]);
  const [configModel, setConfigModel] = useState<AIModel | null>(null);

  const toggleProvider = (p: Provider) =>
    setSelectedProviders((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p]);
  const toggleCapability = (c: Capability) =>
    setSelectedCapabilities((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);

  const filtered = models.filter((m) => {
    if (search && !m.name.toLowerCase().includes(search.toLowerCase()) && !m.provider.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedProviders.length && !selectedProviders.includes(m.provider)) return false;
    if (selectedCapabilities.length && !selectedCapabilities.some((c) => m.capabilities.includes(c))) return false;
    return true;
  });

  const toggleActive = (id: string) => setModels((prev) => prev.map((m) => m.id === id ? { ...m, active: !m.active } : m));
  const setDefault = (id: string) => setModels((prev) => prev.map((m) => ({ ...m, isDefault: m.id === id })));
  const updateParam = (id: string, key: string, value: number) =>
    setModels((prev) => prev.map((m) => m.id === id ? { ...m, params: { ...m.params, [key]: value } } : m));

  const activeCount = models.filter((m) => m.active).length;

  return (
    <div className="p-6 space-y-6 relative">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">AI Model Hub</h1>
          <p className="text-sm text-muted-foreground mt-1">{models.length} models · {activeCount} active</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs gap-1"><Zap className="w-3 h-3" />{activeCount} Active</Badge>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search models..." className="pl-9 bg-background/50 border-border/30 h-9" />
          </div>
          <Button variant="outline" size="sm" className="gap-1.5"><Filter className="w-3.5 h-3.5" />Filters</Button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 self-center mr-1">Capabilities:</span>
          {allCapabilities.map((c) => {
            const Icon = capabilityIcons[c];
            const active = selectedCapabilities.includes(c);
            return (
              <button key={c} onClick={() => toggleCapability(c)}
                className={cn("flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors border",
                  active ? "bg-primary/10 border-primary/30 text-primary" : "bg-background/30 border-border/30 text-muted-foreground hover:text-foreground")}>
                <Icon className="w-3 h-3" />{c}
              </button>
            );
          })}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground/60 self-center mr-1">Providers:</span>
          {allProviders.map((p) => {
            const active = selectedProviders.includes(p);
            return (
              <button key={p} onClick={() => toggleProvider(p)}
                className={cn("px-2 py-1 rounded-md text-[11px] font-medium transition-colors border",
                  active ? "bg-primary/10 border-primary/30 text-primary" : "bg-background/30 border-border/30 text-muted-foreground hover:text-foreground")}>
                {p}
              </button>
            );
          })}
        </div>
      </div>

      {/* Model Grid */}
      <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((model) => (
          <motion.div key={model.id} variants={item}
            className={cn("glass-panel glow-border overflow-hidden group transition-all",
              model.active && "border-primary/20", model.isDefault && "ring-1 ring-primary/30")}>
            <div className={cn("h-1 bg-gradient-to-r to-transparent", providerColors[model.provider] || "from-primary/20")} />
            <div className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">{model.name}</h3>
                    {model.isDefault && <Badge className="text-[9px] h-4 bg-primary/20 text-primary border-primary/30">Default</Badge>}
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{model.provider}</p>
                </div>
                <Switch checked={model.active} onCheckedChange={() => toggleActive(model.id)} />
              </div>
              <p className="text-xs text-muted-foreground/80 line-clamp-2">{model.description}</p>
              <div className="flex flex-wrap gap-1">
                {model.capabilities.map((c) => {
                  const Icon = capabilityIcons[c];
                  return (
                    <span key={c} className={cn("flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium", capabilityColors[c])}>
                      <Icon className="w-2.5 h-2.5" />{c}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center gap-4 text-[11px] text-muted-foreground">
                <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{model.latency}</span>
                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{model.cost}</span>
              </div>
              <div className="flex gap-2 pt-1">
                <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={() => setDefault(model.id)}>
                  <Star className={cn("w-3 h-3 mr-1", model.isDefault && "fill-primary text-primary")} />Set Default
                </Button>
                <Button size="sm" variant="ghost" className="flex-1 h-7 text-xs" onClick={() => setConfigModel(model)}>
                  <Settings2 className="w-3 h-3 mr-1" />Configure
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Config Panel */}
      {configModel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm" onClick={() => setConfigModel(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }}
            className="glass-panel-strong w-[420px] max-h-[80vh] overflow-y-auto scrollbar-thin glow-border" onClick={(e) => e.stopPropagation()}>
            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-foreground">{configModel.name}</h3>
                  <p className="text-[11px] text-muted-foreground">{configModel.provider} · Parameters</p>
                </div>
                <button onClick={() => setConfigModel(null)} className="p-1 rounded-md hover:bg-accent text-muted-foreground"><X className="w-4 h-4" /></button>
              </div>
              <div className="h-px bg-border/50" />
              <div className="space-y-4">
                {Object.entries(configModel.params).map(([key, value]) => {
                  const label = key.replace(/([A-Z])/g, " $1").replace(/^./, (s) => s.toUpperCase());
                  const isSlider = typeof value === "number" && key !== "seed" && key !== "maxTokens" && key !== "resolution" && key !== "fps";
                  const min = key === "temperature" ? 0 : key === "guidanceScale" ? 1 : key === "speed" ? 0.25 : key === "pitch" ? 0.5 : 1;
                  const max = key === "temperature" ? 2 : key === "guidanceScale" ? 20 : key === "speed" ? 4 : key === "pitch" ? 2 : 100;
                  const step = key === "temperature" || key === "speed" || key === "pitch" ? 0.1 : key === "guidanceScale" ? 0.5 : 1;
                  return (
                    <div key={key} className="space-y-1.5">
                      <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
                        {label}: {typeof value === "number" ? value : ""}
                      </Label>
                      {isSlider ? (
                        <Slider value={[value]} onValueChange={([v]) => { updateParam(configModel.id, key, v); setConfigModel((p) => p ? { ...p, params: { ...p.params, [key]: v } } : null); }}
                          min={min} max={max} step={step} />
                      ) : (
                        <Input type="number" value={value}
                          onChange={(e) => { const v = +e.target.value; updateParam(configModel.id, key, v); setConfigModel((p) => p ? { ...p, params: { ...p.params, [key]: v } } : null); }}
                          className="bg-background/50 border-border/30 text-xs h-8" />
                      )}
                    </div>
                  );
                })}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" className="flex-1" onClick={() => setConfigModel(null)}><Check className="w-3 h-3 mr-1" />Apply</Button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
