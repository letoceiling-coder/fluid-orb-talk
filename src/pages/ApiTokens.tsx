import { motion } from "framer-motion";
import { Plus, Trash2, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";

const tokens = [
  { name: "Production API", key: "agw_prod_abc...xyz", created: "Mar 1, 2026", permissions: ["chat", "image", "video"], active: true },
  { name: "Development", key: "agw_dev_def...uvw", created: "Feb 15, 2026", permissions: ["chat"], active: true },
  { name: "Mobile App", key: "agw_mob_ghi...rst", created: "Jan 20, 2026", permissions: ["chat", "image"], active: false },
];

export default function ApiTokens() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-foreground">API Tokens</h1><p className="text-sm text-muted-foreground mt-1">Manage API tokens for external applications</p></div>
        <Dialog>
          <DialogTrigger asChild><Button className="gap-2 text-xs h-9"><Plus className="h-3.5 w-3.5" /> Create Token</Button></DialogTrigger>
          <DialogContent className="glass-panel-strong border-border/50 max-w-md">
            <DialogHeader><DialogTitle className="text-foreground">Create API Token</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5"><label className="text-xs text-muted-foreground">Token Name</label><input className="w-full h-9 px-3 rounded-md bg-secondary/30 border border-border/50 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder="My API Token" /></div>
              <div className="space-y-2"><label className="text-xs text-muted-foreground">Permissions</label>
                {["Chat", "Image Generation", "Video Generation", "Voice Generation", "Data Analysis"].map(p => (
                  <div key={p} className="flex items-center gap-2"><Checkbox id={p} /><label htmlFor={p} className="text-xs text-foreground">{p}</label></div>
                ))}
              </div>
              <Button className="w-full text-xs h-9">Create Token</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <div className="glass-panel glow-border overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="border-b border-border/50">{["Name", "Token", "Permissions", "Created", "Status", ""].map(h => <th key={h} className="text-left py-3 px-4 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
          <tbody>
            {tokens.map((t, i) => (
              <motion.tr key={t.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="border-b border-border/30">
                <td className="py-3 px-4 text-foreground font-medium">{t.name}</td>
                <td className="py-3 px-4 font-mono text-muted-foreground">{t.key}</td>
                <td className="py-3 px-4"><div className="flex gap-1">{t.permissions.map(p => <Badge key={p} variant="outline" className="text-[9px]">{p}</Badge>)}</div></td>
                <td className="py-3 px-4 text-muted-foreground">{t.created}</td>
                <td className="py-3 px-4"><Badge variant={t.active ? "default" : "secondary"} className="text-[9px] h-4">{t.active ? "Active" : "Revoked"}</Badge></td>
                <td className="py-3 px-4"><div className="flex gap-1"><Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toast.success("Copied")}><Copy className="h-3.5 w-3.5" /></Button><Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"><Trash2 className="h-3.5 w-3.5" /></Button></div></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
