import { motion } from "framer-motion";
import { ShoppingBag, Star, Download, Bot, Wrench, Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const items = [
  { name: "SEO Content Writer", type: "Agent", downloads: "2.3K", rating: 4.8, desc: "Generates SEO-optimized blog posts and meta descriptions", icon: Bot },
  { name: "Background Remover", type: "Tool", downloads: "5.1K", rating: 4.9, desc: "AI-powered background removal for product images", icon: Image },
  { name: "Email Campaign Builder", type: "Agent", downloads: "1.8K", rating: 4.6, desc: "Creates personalized email campaigns from brief descriptions", icon: Bot },
  { name: "Code Translator", type: "Tool", downloads: "3.4K", rating: 4.7, desc: "Converts code between programming languages", icon: Wrench },
  { name: "Social Media Manager", type: "Agent", downloads: "4.2K", rating: 4.5, desc: "Schedules and generates social media content", icon: Bot },
  { name: "Data Visualizer", type: "Tool", downloads: "1.5K", rating: 4.4, desc: "Auto-generates charts from raw data inputs", icon: Wrench },
];

export default function Marketplace() {
  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-semibold text-foreground">Marketplace</h1><p className="text-sm text-muted-foreground mt-1">Discover community tools and agents</p></div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item, i) => (
          <motion.div key={item.name} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel p-4 glow-border hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3"><div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center"><item.icon className="h-5 w-5 text-primary" /></div><div className="flex-1"><div className="text-sm font-medium text-foreground">{item.name}</div><div className="flex items-center gap-2 mt-0.5"><Badge variant="outline" className="text-[9px]">{item.type}</Badge><span className="flex items-center gap-0.5 text-[10px] text-amber-400"><Star className="h-2.5 w-2.5 fill-current" />{item.rating}</span></div></div></div>
            <p className="text-xs text-muted-foreground mb-3">{item.desc}</p>
            <div className="flex items-center justify-between"><span className="text-[10px] text-muted-foreground flex items-center gap-1"><Download className="h-3 w-3" />{item.downloads}</span><Button variant="outline" className="text-[10px] h-7">Install</Button></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
