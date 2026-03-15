import { useState } from "react";
import { motion } from "framer-motion";
import { Wand2, Upload, Play, Image as ImageIcon, Video, Music, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const placeholderImages = Array.from({ length: 6 }, (_, i) => ({
  id: i,
  prompt: ["Cyberpunk city", "Abstract art", "Space nebula", "Forest path", "Ocean sunset", "Mountain peak"][i],
  model: ["Flux", "SDXL", "SD3", "Flux", "Playground v2", "SDXL"][i],
}));

export default function MediaStudio() {
  const [imgPrompt, setImgPrompt] = useState("");
  const [vidPrompt, setVidPrompt] = useState("");

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Media Studio</h1>
        <p className="text-sm text-muted-foreground mt-1">Generate images, videos, and audio with AI</p>
      </div>

      <Tabs defaultValue="image" className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/50">
          <TabsTrigger value="image" className="text-xs gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Image</TabsTrigger>
          <TabsTrigger value="video" className="text-xs gap-1.5"><Video className="h-3.5 w-3.5" /> Video</TabsTrigger>
          <TabsTrigger value="animate" className="text-xs gap-1.5"><Sparkles className="h-3.5 w-3.5" /> Animate</TabsTrigger>
          <TabsTrigger value="audio" className="text-xs gap-1.5"><Music className="h-3.5 w-3.5" /> Audio</TabsTrigger>
        </TabsList>

        <TabsContent value="image">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-1 space-y-4">
              <div className="glass-panel p-4 space-y-4 glow-border">
                <Textarea value={imgPrompt} onChange={(e) => setImgPrompt(e.target.value)} placeholder="Describe the image you want to generate..." className="min-h-[100px] bg-secondary/30 border-border/50 text-xs" />
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Provider</label>
                    <Select defaultValue="replicate"><SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="replicate">Replicate</SelectItem><SelectItem value="stability">Stability AI</SelectItem><SelectItem value="leonardo">Leonardo</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Model</label>
                    <Select defaultValue="flux"><SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="flux">Flux</SelectItem><SelectItem value="sdxl">Stable Diffusion XL</SelectItem><SelectItem value="sd3">Stable Diffusion 3</SelectItem><SelectItem value="playground">Playground v2</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs text-muted-foreground">Size</label>
                    <Select defaultValue="1024"><SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="512">512 × 512</SelectItem><SelectItem value="768">768 × 768</SelectItem><SelectItem value="1024">1024 × 1024</SelectItem><SelectItem value="1536">1536 × 1536</SelectItem></SelectContent></Select>
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><label className="text-xs text-muted-foreground">Guidance Scale</label><span className="text-xs text-foreground tabular-nums">7.5</span></div>
                    <Slider defaultValue={[7.5]} min={1} max={20} step={0.5} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between"><label className="text-xs text-muted-foreground">Steps</label><span className="text-xs text-foreground tabular-nums">30</span></div>
                    <Slider defaultValue={[30]} min={10} max={100} step={5} />
                  </div>
                  <Textarea placeholder="Negative prompt..." className="min-h-[60px] bg-secondary/30 border-border/50 text-xs" />
                </div>
                <Button className="w-full gap-2 text-xs h-9"><Wand2 className="h-3.5 w-3.5" /> Generate Image</Button>
              </div>
            </div>

            <div className="xl:col-span-2">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {placeholderImages.map((img) => (
                  <motion.div key={img.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: img.id * 0.05 }} className="glass-panel aspect-square flex flex-col items-center justify-center glow-border group hover:border-primary/30 transition-colors cursor-pointer">
                    <ImageIcon className="h-8 w-8 text-muted-foreground/30 mb-2" />
                    <span className="text-[10px] text-muted-foreground">{img.prompt}</span>
                    <span className="text-[9px] text-muted-foreground/50 mt-0.5">{img.model}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="video">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <div className="xl:col-span-1 glass-panel p-4 space-y-4 glow-border">
              <Textarea value={vidPrompt} onChange={(e) => setVidPrompt(e.target.value)} placeholder="Describe the video..." className="min-h-[100px] bg-secondary/30 border-border/50 text-xs" />
              <div className="space-y-3">
                <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Provider</label><Select defaultValue="runway"><SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="runway">Runway</SelectItem><SelectItem value="pika">Pika</SelectItem><SelectItem value="luma">Luma AI</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Model</label><Select defaultValue="gen3"><SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gen3">Runway Gen3</SelectItem><SelectItem value="pika-v">Pika Video</SelectItem><SelectItem value="luma-dm">Luma Dream Machine</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Duration</label><Select defaultValue="4"><SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="4">4 seconds</SelectItem><SelectItem value="8">8 seconds</SelectItem><SelectItem value="16">16 seconds</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Resolution</label><Select defaultValue="1080"><SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="720">720p</SelectItem><SelectItem value="1080">1080p</SelectItem><SelectItem value="4k">4K</SelectItem></SelectContent></Select></div>
              </div>
              <Button className="w-full gap-2 text-xs h-9"><Play className="h-3.5 w-3.5" /> Generate Video</Button>
            </div>
            <div className="xl:col-span-2 glass-panel aspect-video flex items-center justify-center glow-border">
              <div className="text-center">
                <Video className="h-12 w-12 text-muted-foreground/20 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">Video preview will appear here</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="animate">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[300px] glow-border border-dashed">
              <Upload className="h-10 w-10 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Upload an image to animate</p>
              <p className="text-xs text-muted-foreground/60 mt-1">PNG, JPG up to 10MB</p>
              <Button variant="outline" className="mt-4 text-xs h-8">Choose File</Button>
            </div>
            <div className="glass-panel p-4 space-y-4 glow-border">
              <div className="space-y-3">
                <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Animation Type</label><Select defaultValue="face"><SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="face">Face Animation</SelectItem><SelectItem value="camera">Camera Movement</SelectItem><SelectItem value="avatar">Talking Avatar</SelectItem></SelectContent></Select></div>
              </div>
              <Button className="w-full gap-2 text-xs h-9"><Sparkles className="h-3.5 w-3.5" /> Animate</Button>
              <div className="aspect-video bg-secondary/20 rounded-lg flex items-center justify-center">
                <p className="text-xs text-muted-foreground">Output preview</p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="audio">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="glass-panel p-4 space-y-4 glow-border">
              <Textarea placeholder="Enter text to generate audio..." className="min-h-[120px] bg-secondary/30 border-border/50 text-xs" />
              <div className="space-y-3">
                <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Voice</label><Select defaultValue="rachel"><SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="rachel">Rachel</SelectItem><SelectItem value="adam">Adam</SelectItem><SelectItem value="bella">Bella</SelectItem></SelectContent></Select></div>
                <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Style</label><Select defaultValue="natural"><SelectTrigger className="h-8 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="natural">Natural</SelectItem><SelectItem value="dramatic">Dramatic</SelectItem><SelectItem value="whisper">Whisper</SelectItem></SelectContent></Select></div>
              </div>
              <Button className="w-full gap-2 text-xs h-9"><Music className="h-3.5 w-3.5" /> Generate Audio</Button>
            </div>
            <div className="glass-panel p-4 flex items-center justify-center min-h-[200px] glow-border">
              <div className="text-center"><Music className="h-10 w-10 text-muted-foreground/20 mx-auto mb-2" /><p className="text-xs text-muted-foreground">Audio preview</p></div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
