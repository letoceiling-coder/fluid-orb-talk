import {
  MessageSquare, ImageIcon, Video, ArrowUpFromLine, Palette, Database, Mic, Film,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nodeTypes = [
  { type: "prompt", label: "Prompt", icon: MessageSquare, color: "text-violet-400", settings: { text: "" } },
  { type: "image-generator", label: "Image Gen", icon: ImageIcon, color: "text-blue-400", settings: { model: "stable-diffusion-xl", width: 1024, height: 1024, guidanceScale: 7.5, steps: 30, seed: -1 } },
  { type: "video-generator", label: "Video Gen", icon: Video, color: "text-rose-400", settings: { duration: 4, fps: 24, resolution: "1080p", style: "cinematic" } },
  { type: "image-to-video", label: "Img→Video", icon: Film, color: "text-amber-400", settings: { duration: 4, fps: 24, motionStrength: 0.5 } },
  { type: "voice-generator", label: "Voice Gen", icon: Mic, color: "text-emerald-400", settings: { voiceModel: "alloy", speed: 1.0, pitch: 1.0 } },
  { type: "upscale", label: "Upscale", icon: ArrowUpFromLine, color: "text-cyan-400", settings: { scale: 2, model: "real-esrgan" } },
  { type: "style-modifier", label: "Style Mod", icon: Palette, color: "text-pink-400", settings: { style: "cinematic", strength: 0.7 } },
  { type: "dataset-loader", label: "Dataset", icon: Database, color: "text-orange-400", settings: { source: "", format: "json" } },
];

export function NodePalette() {
  const onDragStart = (event: React.DragEvent, nodeData: (typeof nodeTypes)[0]) => {
    event.dataTransfer.setData(
      "application/reactflow",
      JSON.stringify({ label: nodeData.label, nodeType: nodeData.type, settings: nodeData.settings })
    );
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <div className="glass-panel p-2 space-y-1 w-[140px]">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 px-2 py-1">
        Nodes
      </p>
      {nodeTypes.map((nt) => (
        <div
          key={nt.type}
          draggable
          onDragStart={(e) => onDragStart(e, nt)}
          className={cn(
            "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-grab active:cursor-grabbing",
            "hover:bg-accent/50 transition-colors text-muted-foreground hover:text-foreground"
          )}
        >
          <nt.icon className={cn("w-3.5 h-3.5", nt.color)} />
          <span className="text-[11px] font-medium">{nt.label}</span>
        </div>
      ))}
    </div>
  );
}
