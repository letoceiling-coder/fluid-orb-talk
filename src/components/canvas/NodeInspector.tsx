import { Node } from "reactflow";
import { X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface NodeInspectorProps {
  node: Node | null;
  onSettingsChange: (nodeId: string, settings: Record<string, unknown>) => void;
  onClose: () => void;
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  );
}

function PromptSettings({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
  return (
    <SettingRow label="Prompt Text">
      <Textarea
        value={(settings.text as string) || ""}
        onChange={(e) => onChange({ text: e.target.value })}
        placeholder="Enter your creative prompt..."
        className="min-h-[120px] bg-background/50 border-border/30 text-xs"
      />
    </SettingRow>
  );
}

function ImageGeneratorSettings({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
  return (
    <>
      <SettingRow label="Model">
        <Select value={settings.model as string} onValueChange={(v) => onChange({ model: v })}>
          <SelectTrigger className="bg-background/50 border-border/30 text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="stable-diffusion-xl">Stable Diffusion XL</SelectItem>
            <SelectItem value="dall-e-3">DALL·E 3</SelectItem>
            <SelectItem value="midjourney-v6">Midjourney v6</SelectItem>
            <SelectItem value="flux-pro">Flux Pro</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
      <div className="grid grid-cols-2 gap-2">
        <SettingRow label="Width">
          <Input type="number" value={settings.width as number} onChange={(e) => onChange({ width: +e.target.value })} className="bg-background/50 border-border/30 text-xs h-8" />
        </SettingRow>
        <SettingRow label="Height">
          <Input type="number" value={settings.height as number} onChange={(e) => onChange({ height: +e.target.value })} className="bg-background/50 border-border/30 text-xs h-8" />
        </SettingRow>
      </div>
      <SettingRow label={`Guidance Scale: ${settings.guidanceScale}`}>
        <Slider value={[settings.guidanceScale as number]} onValueChange={([v]) => onChange({ guidanceScale: v })} min={1} max={20} step={0.5} />
      </SettingRow>
      <SettingRow label={`Steps: ${settings.steps}`}>
        <Slider value={[settings.steps as number]} onValueChange={([v]) => onChange({ steps: v })} min={1} max={100} step={1} />
      </SettingRow>
      <SettingRow label="Seed">
        <Input type="number" value={settings.seed as number} onChange={(e) => onChange({ seed: +e.target.value })} className="bg-background/50 border-border/30 text-xs h-8" placeholder="-1 for random" />
      </SettingRow>
    </>
  );
}

function VideoGeneratorSettings({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
  return (
    <>
      <SettingRow label={`Duration: ${settings.duration}s`}>
        <Slider value={[settings.duration as number]} onValueChange={([v]) => onChange({ duration: v })} min={1} max={30} step={1} />
      </SettingRow>
      <SettingRow label={`FPS: ${settings.fps}`}>
        <Slider value={[settings.fps as number]} onValueChange={([v]) => onChange({ fps: v })} min={12} max={60} step={1} />
      </SettingRow>
      <SettingRow label="Resolution">
        <Select value={settings.resolution as string} onValueChange={(v) => onChange({ resolution: v })}>
          <SelectTrigger className="bg-background/50 border-border/30 text-xs h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="720p">720p</SelectItem>
            <SelectItem value="1080p">1080p</SelectItem>
            <SelectItem value="4k">4K</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
      <SettingRow label="Style">
        <Select value={settings.style as string} onValueChange={(v) => onChange({ style: v })}>
          <SelectTrigger className="bg-background/50 border-border/30 text-xs h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="cinematic">Cinematic</SelectItem>
            <SelectItem value="anime">Anime</SelectItem>
            <SelectItem value="realistic">Realistic</SelectItem>
            <SelectItem value="abstract">Abstract</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
    </>
  );
}

function VoiceGeneratorSettings({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
  return (
    <>
      <SettingRow label="Voice Model">
        <Select value={settings.voiceModel as string} onValueChange={(v) => onChange({ voiceModel: v })}>
          <SelectTrigger className="bg-background/50 border-border/30 text-xs h-8"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="alloy">Alloy</SelectItem>
            <SelectItem value="echo">Echo</SelectItem>
            <SelectItem value="fable">Fable</SelectItem>
            <SelectItem value="onyx">Onyx</SelectItem>
            <SelectItem value="nova">Nova</SelectItem>
            <SelectItem value="shimmer">Shimmer</SelectItem>
          </SelectContent>
        </Select>
      </SettingRow>
      <SettingRow label={`Speed: ${settings.speed}x`}>
        <Slider value={[settings.speed as number]} onValueChange={([v]) => onChange({ speed: v })} min={0.25} max={4} step={0.25} />
      </SettingRow>
      <SettingRow label={`Pitch: ${settings.pitch}`}>
        <Slider value={[settings.pitch as number]} onValueChange={([v]) => onChange({ pitch: v })} min={0.5} max={2} step={0.1} />
      </SettingRow>
    </>
  );
}

function GenericSettings({ settings, onChange }: { settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }) {
  return (
    <>
      {Object.entries(settings).map(([key, value]) => (
        <SettingRow key={key} label={key.replace(/([A-Z])/g, " $1").trim()}>
          {typeof value === "number" ? (
            <Input type="number" value={value} onChange={(e) => onChange({ [key]: +e.target.value })} className="bg-background/50 border-border/30 text-xs h-8" />
          ) : (
            <Input value={String(value)} onChange={(e) => onChange({ [key]: e.target.value })} className="bg-background/50 border-border/30 text-xs h-8" />
          )}
        </SettingRow>
      ))}
    </>
  );
}

const settingsMap: Record<string, React.FC<{ settings: Record<string, unknown>; onChange: (s: Record<string, unknown>) => void }>> = {
  prompt: PromptSettings,
  "image-generator": ImageGeneratorSettings,
  "video-generator": VideoGeneratorSettings,
  "voice-generator": VoiceGeneratorSettings,
};

export function NodeInspector({ node, onSettingsChange, onClose }: NodeInspectorProps) {
  if (!node) return null;

  const SettingsComponent = settingsMap[node.data.nodeType] || GenericSettings;

  return (
    <div
      className={cn(
        "absolute right-0 top-0 h-full w-[300px] z-50",
        "bg-card/90 backdrop-blur-2xl border-l border-border/50",
        "animate-slide-in-right overflow-y-auto scrollbar-thin"
      )}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{node.data.label}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Node Inspector</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="h-px bg-border/50" />
        <div className="space-y-3">
          <SettingsComponent
            settings={node.data.settings || {}}
            onChange={(s) => onSettingsChange(node.id, s)}
          />
        </div>
      </div>
    </div>
  );
}
