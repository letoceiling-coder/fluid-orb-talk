import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Image, Video, Play, Sparkles, Clock, CheckCircle2, Loader2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

import cyberpunkCity from "@/assets/demo/cyberpunk-city.jpg";
import aiRobot from "@/assets/demo/ai-robot-portrait.jpg";
import futuristicSushi from "@/assets/demo/futuristic-sushi.jpg";
import productAd from "@/assets/demo/product-ad.jpg";

const demoImages = [
  { id: "img1", title: "Cyberpunk City", prompt: "cyberpunk city skyline at night, neon lights, wet streets", model: "Flux Pro", time: "6.2s", src: cyberpunkCity },
  { id: "img2", title: "AI Robot Portrait", prompt: "humanoid android face with glowing blue eyes, chrome skin", model: "SDXL", time: "4.1s", src: aiRobot },
  { id: "img3", title: "Futuristic Sushi", prompt: "futuristic sushi restaurant, neon ambient, conveyor belt", model: "Flux Pro", time: "5.8s", src: futuristicSushi },
  { id: "img4", title: "Product Advertisement", prompt: "wireless headphones floating, minimalist commercial, studio lighting", model: "Leonardo Phoenix", time: "5.3s", src: productAd },
];

const demoVideos = [
  { id: "vid1", title: "Cyberpunk Drone Shot", prompt: "drone shot over cyberpunk city at night, neon reflections", model: "Runway Gen-3", duration: "4s", thumbnail: cyberpunkCity, status: "complete" as const },
  { id: "vid2", title: "AI Robot Walking", prompt: "AI robot walking through futuristic city, cinematic", model: "Luma Ray 2", duration: "6s", thumbnail: aiRobot, status: "complete" as const },
  { id: "vid3", title: "Food Commercial", prompt: "sushi restaurant commercial, cinematic food shots", model: "Pika 2.0", duration: "4s", thumbnail: futuristicSushi, status: "processing" as const },
];

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, scale: 0.95 }, show: { opacity: 1, scale: 1 } };

export default function DemoMediaGenerator() {
  const [preview, setPreview] = useState<string | null>(null);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Demo Media Generator</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-generated content showcasing platform capabilities</p>
        </div>
        <Badge variant="outline" className="gap-1.5 text-xs"><Sparkles className="w-3 h-3" />7 Assets Generated</Badge>
      </div>

      <Tabs defaultValue="images" className="space-y-4">
        <TabsList className="bg-secondary/30 border border-border/50">
          <TabsTrigger value="images" className="text-xs gap-1.5"><Image className="h-3.5 w-3.5" />Images ({demoImages.length})</TabsTrigger>
          <TabsTrigger value="videos" className="text-xs gap-1.5"><Video className="h-3.5 w-3.5" />Videos ({demoVideos.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="images">
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {demoImages.map((img) => (
              <motion.div key={img.id} variants={item}
                className="glass-panel glow-border overflow-hidden group cursor-pointer hover:border-primary/30 transition-all"
                onClick={() => setPreview(img.src)}>
                <div className="aspect-square relative overflow-hidden">
                  <img src={img.src} alt={img.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <Button size="sm" variant="secondary" className="gap-1.5 text-[10px] h-7"><Eye className="w-3 h-3" />Preview</Button>
                  </div>
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="text-xs font-medium text-foreground">{img.title}</div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{img.prompt}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-[9px]">{img.model}</Badge>
                    <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{img.time}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>

        <TabsContent value="videos">
          <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {demoVideos.map((vid) => (
              <motion.div key={vid.id} variants={item}
                className="glass-panel glow-border overflow-hidden group hover:border-primary/30 transition-all">
                <div className="aspect-video relative overflow-hidden">
                  <img src={vid.thumbnail} alt={vid.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-background/40 flex items-center justify-center">
                    {vid.status === "complete" ? (
                      <motion.div whileHover={{ scale: 1.1 }} className="h-12 w-12 rounded-full bg-primary/90 flex items-center justify-center cursor-pointer">
                        <Play className="h-5 w-5 text-primary-foreground ml-0.5" />
                      </motion.div>
                    ) : (
                      <div className="flex items-center gap-2 glass-panel px-3 py-1.5">
                        <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                        <span className="text-[11px] text-foreground">Processing...</span>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-2 right-2">
                    <Badge className="text-[9px] bg-background/60 backdrop-blur-sm">{vid.duration}</Badge>
                  </div>
                </div>
                <div className="p-3 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-medium text-foreground">{vid.title}</div>
                    {vid.status === "complete" ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground line-clamp-1">{vid.prompt}</p>
                  <Badge variant="outline" className="text-[9px]">{vid.model}</Badge>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Preview modal */}
      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-8"
            onClick={() => setPreview(null)}>
            <motion.img initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              src={preview} alt="Preview" className="max-w-full max-h-full rounded-xl shadow-2xl" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
