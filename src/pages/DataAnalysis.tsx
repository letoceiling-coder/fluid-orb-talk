import { Upload, BarChart3, Table, Map } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, PieChart, Pie, Cell, LineChart, Line } from "recharts";

const barData = [
  { name: "Jan", value: 4000 }, { name: "Feb", value: 3000 }, { name: "Mar", value: 5000 },
  { name: "Apr", value: 4500 }, { name: "May", value: 6000 }, { name: "Jun", value: 5500 },
];
const pieData = [
  { name: "GPT-4o", value: 40 }, { name: "Claude", value: 30 }, { name: "Gemini", value: 20 }, { name: "Other", value: 10 },
];
const COLORS = ["hsl(217, 91%, 60%)", "hsl(280, 65%, 60%)", "hsl(150, 60%, 50%)", "hsl(40, 80%, 55%)"];

export default function DataAnalysis() {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Data Analysis</h1>
        <p className="text-sm text-muted-foreground mt-1">Upload data and generate AI-powered visualizations</p>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="space-y-4">
          <div className="glass-panel p-6 flex flex-col items-center justify-center min-h-[200px] glow-border border-dashed">
            <Upload className="h-8 w-8 text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">Upload CSV or Excel</p>
            <Button variant="outline" className="text-xs h-8 mt-3">Choose File</Button>
          </div>
          <div className="glass-panel p-4 glow-border">
            <Textarea placeholder="Ask AI to analyze your data or create a chart..." className="min-h-[80px] bg-secondary/30 border-border/50 text-xs" />
            <Button className="w-full mt-3 text-xs h-9 gap-2"><BarChart3 className="h-3.5 w-3.5" /> Generate Chart</Button>
          </div>
        </div>
        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-4 glow-border">
              <h3 className="text-xs font-medium text-muted-foreground mb-3">Bar Chart</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData}><CartesianGrid strokeDasharray="3 3" stroke="hsl(240, 4%, 16%)" /><XAxis dataKey="name" tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis tick={{ fill: "hsl(240, 5%, 55%)", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={{ background: "hsl(240, 10%, 8%)", border: "1px solid hsl(240, 4%, 16%)", borderRadius: 8, fontSize: 11, color: "hsl(0, 0%, 98%)" }} /><Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} /></BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="glass-panel p-4 glow-border">
              <h3 className="text-xs font-medium text-muted-foreground mb-3">Distribution</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" stroke="none">{pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}</Pie><Tooltip contentStyle={{ background: "hsl(240, 10%, 8%)", border: "1px solid hsl(240, 4%, 16%)", borderRadius: 8, fontSize: 11, color: "hsl(0, 0%, 98%)" }} /></PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <div className="glass-panel p-4 glow-border">
            <h3 className="text-xs font-medium text-muted-foreground mb-3">Data Preview</h3>
            <div className="overflow-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-border/50">{["Name", "Category", "Value", "Change"].map(h => <th key={h} className="text-left py-2 px-3 text-muted-foreground font-medium">{h}</th>)}</tr></thead>
                <tbody>
                  {[["Product A", "SaaS", "$12,400", "+8.2%"], ["Product B", "API", "$8,900", "+12.5%"], ["Product C", "Enterprise", "$24,100", "-2.1%"]].map((row, i) => (
                    <tr key={i} className="border-b border-border/30"><td className="py-2 px-3 text-foreground">{row[0]}</td><td className="py-2 px-3 text-muted-foreground">{row[1]}</td><td className="py-2 px-3 text-foreground tabular-nums">{row[2]}</td><td className={`py-2 px-3 tabular-nums ${row[3].startsWith("+") ? "text-emerald-400" : "text-red-400"}`}>{row[3]}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
