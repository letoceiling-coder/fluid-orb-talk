import { useCallback, useState, useMemo } from "react";
import ReactFlow, {
  Background, Controls, MiniMap, addEdge, useNodesState, useEdgesState,
  Connection, Edge, Node, BackgroundVariant, Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, RotateCcw, Save, FileText, Clock, Zap, ChevronDown, X,
  MessageSquare, ImageIcon, Video, Mic, Globe, HardDrive, Bot, Timer,
  Upload, Calendar, Webhook, CheckCircle2, AlertCircle, Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Handle, Position, NodeProps } from "reactflow";

// ─── Node type config ───
const nodeConfig: Record<string, { icon: React.ElementType; color: string; gradient: string; category: string }> = {
  trigger:          { icon: Zap,            color: "text-amber-400",   gradient: "from-amber-500/20 to-amber-600/5", category: "trigger" },
  prompt:           { icon: MessageSquare,  color: "text-violet-400",  gradient: "from-violet-500/20 to-violet-600/5", category: "processing" },
  "ai-model":       { icon: Bot,            color: "text-blue-400",    gradient: "from-blue-500/20 to-blue-600/5", category: "processing" },
  "image-generator":{ icon: ImageIcon,      color: "text-purple-400",  gradient: "from-purple-500/20 to-purple-600/5", category: "generation" },
  "video-generator":{ icon: Video,          color: "text-rose-400",    gradient: "from-rose-500/20 to-rose-600/5", category: "generation" },
  "voice-generator":{ icon: Mic,            color: "text-emerald-400", gradient: "from-emerald-500/20 to-emerald-600/5", category: "generation" },
  "api-call":       { icon: Globe,          color: "text-cyan-400",    gradient: "from-cyan-500/20 to-cyan-600/5", category: "integration" },
  storage:          { icon: HardDrive,      color: "text-orange-400",  gradient: "from-orange-500/20 to-orange-600/5", category: "output" },
};

const triggerTypes = [
  { id: "user-message", label: "User Message", icon: MessageSquare },
  { id: "file-upload", label: "File Uploaded", icon: Upload },
  { id: "scheduled", label: "Scheduled Time", icon: Calendar },
  { id: "api-request", label: "API Request", icon: Webhook },
];

// ─── Workflow Node Component ───
function WorkflowNode({ data, selected }: NodeProps) {
  const config = nodeConfig[data.nodeType] || nodeConfig.trigger;
  const Icon = config.icon;
  return (
    <div className={cn(
      "relative min-w-[220px] rounded-xl border backdrop-blur-xl transition-all duration-200",
      "bg-card/80 border-border/50 shadow-lg",
      selected && "border-primary/60 shadow-primary/20 shadow-xl ring-1 ring-primary/30"
    )}>
      <Handle type="target" position={Position.Left} className="!w-3 !h-3 !bg-primary !border-2 !border-background !-left-1.5" />
      <div className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-60", config.gradient)} />
      <div className="relative p-3">
        <div className="flex items-center gap-2.5 mb-1.5">
          <div className={cn("flex items-center justify-center w-7 h-7 rounded-lg bg-background/50", config.color)}>
            <Icon className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-semibold text-foreground block">{data.label}</span>
            {data.subtitle && <span className="text-[10px] text-muted-foreground">{data.subtitle}</span>}
          </div>
        </div>
        {data.status && (
          <div className="flex items-center gap-1.5 mt-2">
            {data.status === "running" && <Loader2 className="w-3 h-3 text-primary animate-spin" />}
            {data.status === "done" && <CheckCircle2 className="w-3 h-3 text-emerald-400" />}
            {data.status === "error" && <AlertCircle className="w-3 h-3 text-destructive" />}
            <span className={cn("text-[10px]",
              data.status === "running" && "text-primary",
              data.status === "done" && "text-emerald-400",
              data.status === "error" && "text-destructive"
            )}>{data.status === "running" ? "Processing..." : data.status === "done" ? "Completed" : "Error"}</span>
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} className="!w-3 !h-3 !bg-primary !border-2 !border-background !-right-1.5" />
    </div>
  );
}

// ─── Templates ───
const templates = [
  {
    id: "youtube",
    name: "YouTube Video Generator",
    description: "Generate script, voiceover, images, and compile video",
    nodes: [
      { id: "t1", type: "workflowNode", position: { x: 50, y: 200 }, data: { label: "User Message", nodeType: "trigger", subtitle: "Topic input" } },
      { id: "t2", type: "workflowNode", position: { x: 320, y: 120 }, data: { label: "Script Writer", nodeType: "ai-model", subtitle: "GPT-5" } },
      { id: "t3", type: "workflowNode", position: { x: 320, y: 300 }, data: { label: "Image Prompt Gen", nodeType: "prompt", subtitle: "Scene descriptions" } },
      { id: "t4", type: "workflowNode", position: { x: 590, y: 120 }, data: { label: "Voice Over", nodeType: "voice-generator", subtitle: "ElevenLabs" } },
      { id: "t5", type: "workflowNode", position: { x: 590, y: 300 }, data: { label: "Scene Images", nodeType: "image-generator", subtitle: "Flux Pro" } },
      { id: "t6", type: "workflowNode", position: { x: 860, y: 200 }, data: { label: "Video Compiler", nodeType: "video-generator", subtitle: "Runway Gen-3" } },
      { id: "t7", type: "workflowNode", position: { x: 1130, y: 200 }, data: { label: "Save to Storage", nodeType: "storage", subtitle: "Cloud" } },
    ],
    edges: [
      { id: "te1", source: "t1", target: "t2" }, { id: "te2", source: "t1", target: "t3" },
      { id: "te3", source: "t2", target: "t4" }, { id: "te4", source: "t3", target: "t5" },
      { id: "te5", source: "t4", target: "t6" }, { id: "te6", source: "t5", target: "t6" },
      { id: "te7", source: "t6", target: "t7" },
    ],
  },
  {
    id: "social",
    name: "Social Media Content",
    description: "Generate text, images, and schedule posts",
    nodes: [
      { id: "s1", type: "workflowNode", position: { x: 50, y: 200 }, data: { label: "Schedule", nodeType: "trigger", subtitle: "Daily 9am" } },
      { id: "s2", type: "workflowNode", position: { x: 320, y: 200 }, data: { label: "Content Writer", nodeType: "ai-model", subtitle: "GPT-5" } },
      { id: "s3", type: "workflowNode", position: { x: 590, y: 120 }, data: { label: "Image Gen", nodeType: "image-generator", subtitle: "SDXL" } },
      { id: "s4", type: "workflowNode", position: { x: 590, y: 300 }, data: { label: "Hashtag AI", nodeType: "prompt", subtitle: "Tag generator" } },
      { id: "s5", type: "workflowNode", position: { x: 860, y: 200 }, data: { label: "Post API", nodeType: "api-call", subtitle: "Social APIs" } },
    ],
    edges: [
      { id: "se1", source: "s1", target: "s2" }, { id: "se2", source: "s2", target: "s3" },
      { id: "se3", source: "s2", target: "s4" }, { id: "se4", source: "s3", target: "s5" },
      { id: "se5", source: "s4", target: "s5" },
    ],
  },
  {
    id: "research",
    name: "Research Automation",
    description: "Fetch, analyze, summarize, and store research data",
    nodes: [
      { id: "r1", type: "workflowNode", position: { x: 50, y: 200 }, data: { label: "API Trigger", nodeType: "trigger", subtitle: "Research query" } },
      { id: "r2", type: "workflowNode", position: { x: 320, y: 200 }, data: { label: "Web Scraper", nodeType: "api-call", subtitle: "Search APIs" } },
      { id: "r3", type: "workflowNode", position: { x: 590, y: 200 }, data: { label: "Analyzer", nodeType: "ai-model", subtitle: "Gemini Pro" } },
      { id: "r4", type: "workflowNode", position: { x: 860, y: 200 }, data: { label: "Report Writer", nodeType: "prompt", subtitle: "Summary" } },
      { id: "r5", type: "workflowNode", position: { x: 1130, y: 200 }, data: { label: "Save Report", nodeType: "storage", subtitle: "Database" } },
    ],
    edges: [
      { id: "re1", source: "r1", target: "r2" }, { id: "re2", source: "r2", target: "r3" },
      { id: "re3", source: "r3", target: "r4" }, { id: "re4", source: "r4", target: "r5" },
    ],
  },
];

// ─── Execution Logs ───
const mockLogs = [
  { time: "12:04:32", node: "Trigger", status: "done" as const, message: "User message received", duration: "12ms" },
  { time: "12:04:33", node: "AI Model", status: "done" as const, message: "Generated 847 tokens", duration: "1.2s" },
  { time: "12:04:35", node: "Image Gen", status: "done" as const, message: "Created 1024x1024 image", duration: "4.3s" },
  { time: "12:04:40", node: "Video Gen", status: "running" as const, message: "Rendering frames...", duration: "—" },
];

const edgeStyle = { stroke: "hsl(217 91% 60%)", strokeWidth: 2 };
let nodeId = 100;

// ─── Palette items ───
const paletteItems = [
  { type: "trigger", label: "Trigger", icon: Zap, subtitle: "Start workflow" },
  { type: "prompt", label: "Prompt", icon: MessageSquare, subtitle: "Text input" },
  { type: "ai-model", label: "AI Model", icon: Bot, subtitle: "LLM inference" },
  { type: "image-generator", label: "Image Gen", icon: ImageIcon, subtitle: "Generate images" },
  { type: "video-generator", label: "Video Gen", icon: Video, subtitle: "Generate video" },
  { type: "voice-generator", label: "Voice Gen", icon: Mic, subtitle: "Synthesize voice" },
  { type: "api-call", label: "API Call", icon: Globe, subtitle: "External request" },
  { type: "storage", label: "Storage", icon: HardDrive, subtitle: "Save output" },
];

export default function AIAutomationBuilder() {
  const nodeTypes = useMemo(() => ({ workflowNode: WorkflowNode }), []);

  const defaultEdgeOptions = useMemo(() => ({
    type: "smoothstep", animated: true, style: edgeStyle,
  }), []);

  const [nodes, setNodes, onNodesChange] = useNodesState(templates[0].nodes as Node[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    templates[0].edges.map((e) => ({ ...e, animated: true, style: edgeStyle }))
  );
  const [showLogs, setShowLogs] = useState(false);
  const [running, setRunning] = useState(false);
  const [activeTemplate, setActiveTemplate] = useState("youtube");

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true, style: edgeStyle }, eds)),
    [setEdges]
  );

  const loadTemplate = (id: string) => {
    const t = templates.find((t) => t.id === id);
    if (!t) return;
    setActiveTemplate(id);
    setNodes(t.nodes as Node[]);
    setEdges(t.edges.map((e) => ({ ...e, animated: true, style: edgeStyle })));
  };

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    const data = event.dataTransfer.getData("application/automation-node");
    if (!data) return;
    const parsed = JSON.parse(data);
    const bounds = (event.target as HTMLElement).closest(".react-flow")?.getBoundingClientRect();
    if (!bounds) return;
    const position = { x: event.clientX - bounds.left - 110, y: event.clientY - bounds.top - 30 };
    setNodes((nds) => nds.concat({ id: `node-${nodeId++}`, type: "workflowNode", position, data: parsed } as Node));
  }, [setNodes]);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const simulateRun = () => {
    setRunning(true);
    setShowLogs(true);
    setTimeout(() => setRunning(false), 3000);
  };

  return (
    <div className="h-[calc(100vh-3rem)] w-full relative overflow-hidden bg-background flex flex-col">
      {/* Toolbar */}
      <div className="h-12 border-b border-border/50 bg-card/60 backdrop-blur-xl flex items-center justify-between px-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Zap className="w-4 h-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">AI Automation Builder</span>
          <Badge variant="outline" className="text-[10px]">{nodes.length} nodes</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5" onClick={() => setShowLogs(!showLogs)}>
            <FileText className="w-3 h-3" />Logs
          </Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs gap-1.5"><Save className="w-3 h-3" />Save</Button>
          <Button size="sm" className="h-7 text-xs gap-1.5" onClick={simulateRun} disabled={running}>
            {running ? <><Pause className="w-3 h-3" />Running...</> : <><Play className="w-3 h-3" />Run</>}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex relative">
        <ReactFlow
          nodes={nodes} edges={edges}
          onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
          onConnect={onConnect} onDrop={onDrop} onDragOver={onDragOver}
          nodeTypes={nodeTypes} fitView
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={defaultEdgeOptions}
          className="bg-background"
        >
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(240 4% 16%)" />
          <Controls className="!bg-card/80 !backdrop-blur-xl !border-border/50 !rounded-xl !shadow-2xl [&>button]:!bg-transparent [&>button]:!border-border/30 [&>button]:!text-muted-foreground [&>button:hover]:!bg-accent" />
          <MiniMap className="!bg-card/60 !backdrop-blur-xl !border-border/50 !rounded-xl" nodeColor="hsl(217 91% 60%)" maskColor="hsl(240 10% 3.9% / 0.7)" />

          {/* Node Palette */}
          <Panel position="top-left" className="!m-3">
            <div className="glass-panel p-2 w-[160px] space-y-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-1">Workflow Nodes</p>
              {paletteItems.map((item) => (
                <div key={item.type} draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/automation-node", JSON.stringify({ label: item.label, nodeType: item.type, subtitle: item.subtitle }));
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground">
                  <item.icon className={cn("w-3.5 h-3.5", nodeConfig[item.type]?.color)} />
                  <div>
                    <span className="text-[11px] font-medium block">{item.label}</span>
                    <span className="text-[9px] text-muted-foreground/60">{item.subtitle}</span>
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          {/* Templates */}
          <Panel position="top-right" className="!m-3">
            <div className="glass-panel p-3 w-[240px] space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">Templates</p>
              {templates.map((t) => (
                <button key={t.id} onClick={() => loadTemplate(t.id)}
                  className={cn("w-full text-left p-2 rounded-lg transition-colors",
                    activeTemplate === t.id ? "bg-primary/10 border border-primary/30" : "hover:bg-accent/50 border border-transparent")}>
                  <span className="text-xs font-medium text-foreground block">{t.name}</span>
                  <span className="text-[10px] text-muted-foreground">{t.description}</span>
                </button>
              ))}
            </div>
          </Panel>
        </ReactFlow>

        {/* Execution Logs */}
        <AnimatePresence>
          {showLogs && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 200, opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="absolute bottom-0 left-0 right-0 bg-card/90 backdrop-blur-2xl border-t border-border/50 z-30 overflow-hidden">
              <div className="p-3 h-full flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">Execution Logs</span>
                    {running && <Badge className="text-[9px] h-4 bg-primary/20 text-primary animate-pulse">Live</Badge>}
                  </div>
                  <button onClick={() => setShowLogs(false)} className="p-1 rounded-md hover:bg-accent text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-thin space-y-1">
                  {mockLogs.map((log, i) => (
                    <div key={i} className="flex items-center gap-3 text-[11px] px-2 py-1 rounded-md hover:bg-accent/30">
                      <span className="text-muted-foreground/60 tabular-nums w-16">{log.time}</span>
                      {log.status === "done" ? <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" /> : <Loader2 className="w-3 h-3 text-primary animate-spin shrink-0" />}
                      <span className="text-foreground font-medium w-20">{log.node}</span>
                      <span className="text-muted-foreground flex-1">{log.message}</span>
                      <span className="text-muted-foreground/60 tabular-nums">{log.duration}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
