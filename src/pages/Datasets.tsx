import { motion } from "framer-motion";
import { Database, Upload, Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const datasets = [
  { name: "Customer Support QA", records: "12,450", size: "24 MB", format: "JSONL", updated: "Mar 12, 2026" },
  { name: "Product Descriptions", records: "8,200", size: "15 MB", format: "CSV", updated: "Mar 10, 2026" },
  { name: "Image Captions", records: "45,000", size: "120 MB", format: "Parquet", updated: "Mar 5, 2026" },
  { name: "Code Examples", records: "5,600", size: "8 MB", format: "JSONL", updated: "Feb 28, 2026" },
];

export default function Datasets() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-semibold text-foreground">Datasets</h1><p className="text-sm text-muted-foreground mt-1">Upload and manage training data</p></div>
        <Button className="gap-2 text-xs h-9"><Plus className="h-3.5 w-3.5" /> New Dataset</Button>
      </div>
      <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[160px] glow-border border-dashed">
        <Upload className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-sm text-muted-foreground">Upload dataset files</p>
        <p className="text-xs text-muted-foreground/60 mt-1">CSV, JSONL, Parquet — up to 500MB</p>
        <Button variant="outline" className="text-xs h-8 mt-3">Choose Files</Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {datasets.map((d, i) => (
          <motion.div key={d.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-panel p-4 glow-border hover:border-primary/30 transition-colors">
            <div className="flex items-center gap-3 mb-3"><div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center"><Database className="h-4 w-4 text-primary" /></div><div><div className="text-sm font-medium text-foreground">{d.name}</div><div className="text-[10px] text-muted-foreground">{d.updated}</div></div><Badge variant="outline" className="text-[9px] ml-auto">{d.format}</Badge></div>
            <div className="flex gap-4 text-xs text-muted-foreground"><span>{d.records} records</span><span>{d.size}</span></div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
