import { Mic, Play, Upload, Volume2, Pause } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function VoiceStudio() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Voice Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">Text-to-speech, transcription, and voice cloning — powered by ElevenLabs</p>
      </div>
      <Tabs defaultValue="tts" className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/50">
          <TabsTrigger value="tts" className="text-xs gap-1.5"><Volume2 className="h-3.5 w-3.5" /> Text to Speech</TabsTrigger>
          <TabsTrigger value="stt" className="text-xs gap-1.5"><Mic className="h-3.5 w-3.5" /> Speech to Text</TabsTrigger>
          <TabsTrigger value="clone" className="text-xs gap-1.5"><Play className="h-3.5 w-3.5" /> Voice Cloning</TabsTrigger>
        </TabsList>
        <TabsContent value="tts">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="glass-panel p-4 space-y-4 glow-border">
              <Textarea placeholder="Enter text to synthesize..." className="min-h-[150px] bg-secondary/30 border-border/50 text-xs" />
              <div className="space-y-3">
                <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Voice</label><Select defaultValue="rachel"><SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rachel">Rachel</SelectItem><SelectItem value="adam">Adam</SelectItem><SelectItem value="bella">Bella</SelectItem><SelectItem value="josh">Josh</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><div className="flex justify-between"><label className="text-xs text-muted-foreground">Speed</label><span className="text-xs text-foreground tabular-nums">1.0x</span></div><Slider defaultValue={[1]} min={0.5} max={2} step={0.1} /></div>
                <div className="space-y-1.5"><div className="flex justify-between"><label className="text-xs text-muted-foreground">Pitch</label><span className="text-xs text-foreground tabular-nums">0</span></div><Slider defaultValue={[0]} min={-12} max={12} step={1} /></div>
              </div>
              <Button className="w-full gap-2 text-xs h-9"><Play className="h-3.5 w-3.5" /> Generate Speech</Button>
            </div>
            <div className="glass-panel p-6 flex flex-col items-center justify-center glow-border min-h-[300px]">
              <Volume2 className="h-12 w-12 text-muted-foreground/20 mb-3" />
              <p className="text-xs text-muted-foreground">Audio player will appear here</p>
              <div className="w-full max-w-xs mt-6 h-1 bg-secondary/50 rounded-full" />
            </div>
          </div>
        </TabsContent>
        <TabsContent value="stt">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px] glow-border border-dashed">
              <Upload className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Upload audio to transcribe</p>
              <p className="text-xs text-muted-foreground/60 mt-1">MP3, WAV, M4A up to 25MB</p>
              <div className="flex gap-2 mt-4">
                <Button variant="outline" className="text-xs h-8">Upload File</Button>
                <Button variant="outline" className="text-xs h-8 gap-1.5"><Mic className="h-3.5 w-3.5" /> Record</Button>
              </div>
            </div>
            <div className="glass-panel p-4 glow-border">
              <h3 className="text-xs font-medium text-muted-foreground mb-3">Transcription Output</h3>
              <div className="bg-secondary/20 rounded-lg p-4 min-h-[240px]">
                <p className="text-xs text-muted-foreground/50 italic">Transcribed text will appear here...</p>
              </div>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="clone">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px] glow-border border-dashed">
              <Upload className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Upload voice samples for cloning</p>
              <p className="text-xs text-muted-foreground/60 mt-1">At least 30 seconds of clean audio</p>
              <Button variant="outline" className="text-xs h-8 mt-4">Upload Samples</Button>
            </div>
            <div className="glass-panel p-4 space-y-4 glow-border">
              <h3 className="text-xs font-medium text-foreground">Clone Configuration</h3>
              <div className="space-y-3">
                <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Voice Name</label><input className="w-full h-8 px-3 rounded-md bg-secondary/30 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="My Custom Voice" /></div>
                <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Description</label><Textarea placeholder="Describe the voice characteristics..." className="min-h-[80px] bg-secondary/30 border-border/50 text-xs" /></div>
              </div>
              <Button className="w-full gap-2 text-xs h-9">Clone Voice</Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
