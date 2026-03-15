import { motion } from "framer-motion";
import { Image, Video, Music, Upload, Download, HardDrive, Play } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

import cyberpunkCity from "@/assets/demo/cyberpunk-city.jpg";
import aiRobot from "@/assets/demo/ai-robot-portrait.jpg";
import futuristicSushi from "@/assets/demo/futuristic-sushi.jpg";
import productAd from "@/assets/demo/product-ad.jpg";

const imageFiles = [
  { name: "cyberpunk_city.png", size: "4.2 MB", date: "Mar 14, 2026", thumb: cyberpunkCity },
  { name: "ai_robot_portrait.png", size: "3.8 MB", date: "Mar 14, 2026", thumb: aiRobot },
  { name: "futuristic_sushi.png", size: "5.1 MB", date: "Mar 13, 2026", thumb: futuristicSushi },
  { name: "product_ad.png", size: "2.9 MB", date: "Mar 13, 2026", thumb: productAd },
  { name: "neon_landscape.png", size: "3.5 MB", date: "Mar 12, 2026", thumb: cyberpunkCity },
  { name: "robot_closeup.png", size: "4.0 MB", date: "Mar 12, 2026", thumb: aiRobot },
  { name: "sushi_detail.png", size: "3.2 MB", date: "Mar 11, 2026", thumb: futuristicSushi },
  { name: "headphones_hero.png", size: "2.7 MB", date: "Mar 11, 2026", thumb: productAd },
];

const videoFiles = [
  { name: "cyberpunk_drone.mp4", size: "48.2 MB", date: "Mar 14, 2026", thumb: cyberpunkCity, duration: "0:04" },
  { name: "robot_walk.mp4", size: "62.1 MB", date: "Mar 13, 2026", thumb: aiRobot, duration: "0:06" },
  { name: "food_commercial.mp4", size: "35.8 MB", date: "Mar 12, 2026", thumb: futuristicSushi, duration: "0:04" },
  { name: "product_reveal.mp4", size: "28.4 MB", date: "Mar 11, 2026", thumb: productAd, duration: "0:03" },
];

const audioFiles = [
  { name: "voiceover_intro.mp3", size: "2.1 MB", date: "Mar 14, 2026" },
  { name: "narration_cyberpunk.mp3", size: "3.4 MB", date: "Mar 13, 2026" },
  { name: "ad_voice_female.mp3", size: "1.8 MB", date: "Mar 12, 2026" },
  { name: "podcast_segment.mp3", size: "5.2 MB", date: "Mar 11, 2026" },
  { name: "sfx_transition.mp3", size: "0.4 MB", date: "Mar 10, 2026" },
  { name: "ambient_loop.mp3", size: "8.1 MB", date: "Mar 10, 2026" },
];

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
          <TabsTrigger value="images" className="text-xs gap-1.5"><Image className="h-3.5 w-3.5" /> Images ({imageFiles.length})</TabsTrigger>
          <TabsTrigger value="videos" className="text-xs gap-1.5"><Video className="h-3.5 w-3.5" /> Videos ({videoFiles.length})</TabsTrigger>
          <TabsTrigger value="audio" className="text-xs gap-1.5"><Music className="h-3.5 w-3.5" /> Audio ({audioFiles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {imageFiles.map((f, i) => (
              <motion.div key={f.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                className="glass-panel overflow-hidden glow-border group hover:border-primary/30 transition-colors">
                <div className="aspect-square overflow-hidden">
                  <img src={f.thumb} alt={f.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                </div>
                <div className="p-2.5">
                  <div className="text-xs text-foreground truncate">{f.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{f.size}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"><Download className="h-3 w-3" /></Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="videos">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {videoFiles.map((f, i) => (
              <motion.div key={f.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                className="glass-panel overflow-hidden glow-border group hover:border-primary/30 transition-colors">
                <div className="aspect-video relative overflow-hidden">
                  <img src={f.thumb} alt={f.name} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="h-10 w-10 rounded-full bg-primary/90 flex items-center justify-center"><Play className="h-4 w-4 text-primary-foreground ml-0.5" /></div>
                  </div>
                  <span className="absolute bottom-1.5 right-1.5 text-[9px] bg-background/70 backdrop-blur-sm px-1.5 py-0.5 rounded text-foreground">{f.duration}</span>
                </div>
                <div className="p-2.5">
                  <div className="text-xs text-foreground truncate">{f.name}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[10px] text-muted-foreground">{f.size}</span>
                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity"><Download className="h-3 w-3" /></Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="audio">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {audioFiles.map((f, i) => (
              <motion.div key={f.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
                className="glass-panel p-3 glow-border group hover:border-primary/30 transition-colors">
                <div className="aspect-square bg-secondary/20 rounded-lg flex items-center justify-center mb-2">
                  <Music className="h-6 w-6 text-muted-foreground/30" />
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
      </Tabs>
    </div>
  );
}
