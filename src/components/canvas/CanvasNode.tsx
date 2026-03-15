import { memo } from "react";
import { Handle, Position, NodeProps } from "reactflow";
import {
  MessageSquare, ImageIcon, Video, ArrowUpFromLine, Palette, Database, Mic, Film,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nodeConfig: Record<string, { icon: React.ElementType; color: string; gradient: string }> = {
  prompt: { icon: MessageSquare, color: "text-violet-400", gradient: "from-violet-500/20 to-violet-600/5" },
  "image-generator": { icon: ImageIcon, color: "text-blue-400", gradient: "from-blue-500/20 to-blue-600/5" },
  "video-generator": { icon: Video, color: "text-rose-400", gradient: "from-rose-500/20 to-rose-600/5" },
  "image-to-video": { icon: Film, color: "text-amber-400", gradient: "from-amber-500/20 to-amber-600/5" },
  "voice-generator": { icon: Mic, color: "text-emerald-400", gradient: "from-emerald-500/20 to-emerald-600/5" },
  upscale: { icon: ArrowUpFromLine, color: "text-cyan-400", gradient: "from-cyan-500/20 to-cyan-600/5" },
  "style-modifier": { icon: Palette, color: "text-pink-400", gradient: "from-pink-500/20 to-pink-600/5" },
  "dataset-loader": { icon: Database, color: "text-orange-400", gradient: "from-orange-500/20 to-orange-600/5" },
};

export const CanvasNode = memo(({ data, selected }: NodeProps) => {
  const config = nodeConfig[data.nodeType] || nodeConfig.prompt;
  const Icon = config.icon;

  return (
    <div
      className={cn(
        "relative min-w-[200px] rounded-xl border backdrop-blur-xl transition-all duration-200",
        "bg-card/80 border-border/50 shadow-lg",
        selected && "border-primary/60 shadow-primary/20 shadow-xl ring-1 ring-primary/30"
      )}
    >
      <Handle
        type="target"
        position={Position.Left}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background !-left-1.5"
      />
      <div className={cn("absolute inset-0 rounded-xl bg-gradient-to-br opacity-60", config.gradient)} />
      <div className="relative p-3">
        <div className="flex items-center gap-2.5 mb-2">
          <div className={cn("flex items-center justify-center w-7 h-7 rounded-lg bg-background/50", config.color)}>
            <Icon className="w-4 h-4" />
          </div>
          <span className="text-xs font-semibold text-foreground">{data.label}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="h-1 flex-1 rounded-full bg-primary/20">
            <div className="h-full w-2/3 rounded-full bg-primary/50" />
          </div>
          <span className="text-[10px] text-muted-foreground">Ready</span>
        </div>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-primary !border-2 !border-background !-right-1.5"
      />
    </div>
  );
});

CanvasNode.displayName = "CanvasNode";
