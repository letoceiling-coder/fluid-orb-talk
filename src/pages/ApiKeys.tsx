import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Eye, EyeOff, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

const keyGroups = [
  { label: "AI Models", keys: [
    { name: "OPENAI_API_KEY", configured: true }, { name: "GEMINI_API_KEY", configured: true }, { name: "ANTHROPIC_API_KEY", configured: false },
  ]},
  { label: "Media", keys: [
    { name: "REPLICATE_API_TOKEN", configured: true }, { name: "STABILITY_API_KEY", configured: false }, { name: "LEONARDO_API_KEY", configured: false },
    { name: "RUNWAY_API_KEY", configured: true }, { name: "PIKA_API_KEY", configured: false }, { name: "LUMA_API_KEY", configured: false },
    { name: "ELEVENLABS_API_KEY", configured: true },
  ]},
  { label: "Infrastructure", keys: [
    { name: "PINECONE_API_KEY", configured: false },
    { name: "S3_ACCESS_KEY", configured: true }, { name: "S3_SECRET", configured: true }, { name: "S3_BUCKET", configured: true },
  ]},
  { label: "Payments & Monitoring", keys: [
    { name: "STRIPE_SECRET_KEY", configured: false }, { name: "STRIPE_PUBLIC_KEY", configured: false }, { name: "SENTRY_DSN", configured: true },
  ]},
];

export default function ApiKeys() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  return (
    <div className="p-6 space-y-6">
      <div><h1 className="text-2xl font-semibold text-foreground">API Keys</h1><p className="text-sm text-muted-foreground mt-1">Manage your service provider API keys</p></div>
      <div className="space-y-6">
        {keyGroups.map((group) => (
          <motion.div key={group.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{group.label}</h2>
            <div className="glass-panel glow-border divide-y divide-border/30">
              {group.keys.map((k) => (
                <div key={k.name} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Key className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-xs font-mono text-foreground">{k.name}</span>
                    <Badge variant={k.configured ? "default" : "secondary"} className="text-[9px] h-4">{k.configured ? "Configured" : "Not Set"}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    {k.configured && (
                      <>
                        <div className="text-xs text-muted-foreground font-mono mr-2">{revealed[k.name] ? "sk-proj-abc...xyz" : "••••••••••••"}</div>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setRevealed(p => ({ ...p, [k.name]: !p[k.name] }))}>
                          {revealed[k.name] ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.success("Copied to clipboard")}><Copy className="h-3.5 w-3.5" /></Button>
                      </>
                    )}
                    {!k.configured && <Button variant="outline" className="text-[10px] h-7">Configure</Button>}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
