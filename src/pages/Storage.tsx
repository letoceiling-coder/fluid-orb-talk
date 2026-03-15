import { motion } from "framer-motion";
import { Image, Video, Music, Upload, Download, HardDrive } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const files = {
  images: Array.from({ length: 8 }, (_, i) => ({ name: `image_${i + 1}.png`, size: `${(Math.random() * 5 + 1).toFixed(1)} MB`, date: "Mar 12, 2026" })),
  videos: Array.from({ length: 4 }, (_, i) => ({ name: `video_${i + 1}.mp4`, size: `${(Math.random() * 50 + 10).toFixed(1)} MB`, date: "Mar 10, 2026" })),
  audio: Array.from({ length: 6 }, (_, i) => ({ name: `audio_${i + 1}.mp3`, size: `${(Math.random() * 10 + 1).toFixed(1)} MB`, date: "Mar 8, 2026" })),
};

export default function Storage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-foreground">Storage</h1><p className="text-sm text-muted-foreground mt-1">Manage your generated media files</p></div>
        <Button variant="outline" className="gap-2 text-xs h-9"><Upload className="h-3.5 w-3.5" /> Upload</Button>
      </div>
      <div className="glass-panel p-4 glow-border">
        <div className="flex items-center justify-between mb-2"><span className="text-xs text-muted-foreground">Storage Used</span><span className="text-xs text-foreground tabular-nums">4.2 GB / 10 GB</span></div>
        <Progress value={42} className="h-1.5" />
      </div>
      <Tabs defaultValue="images" className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/50">
          <TabsTrigger value="images" className="text-xs gap-1.5"><Image className="h-3.5 w-3.5" /> Images</TabsTrigger>
          <TabsTrigger value="videos" className="text-xs gap-1.5"><Video className="h-3.5 w-3.5" /> Videos</TabsTrigger>
          <TabsTrigger value="audio" className="text-xs gap-1.5"><Music className="h-3.5 w-3.5" /> Audio</TabsTrigger>
        </TabsList>
        {(["images", "videos", "audio"] as const).map(tab => (
          <TabsContent key={tab} value={tab}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {files[tab].map((f, i) => (
                <motion.div key={f.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }} className="glass-panel p-3 glow-border group hover:border-primary/30 transition-colors">
                  <div className="aspect-square bg-secondary/20 rounded-lg flex items-center justify-center mb-2">
                    {tab === "images" ? <Image className="h-6 w-6 text-muted-foreground/30" /> : tab === "videos" ? <Video className="h-6 w-6 text-muted-foreground/30" /> : <Music className="h-6 w-6 text-muted-foreground/30" />}
                  </div>
                  <div className="text-xs text-foreground truncate">{f.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{f.size}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"><Download className="h-3 w-3" /></Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
