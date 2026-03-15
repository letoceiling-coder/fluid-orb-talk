import { User, Bell, Palette, Globe, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function Settings() {
  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div><h1 className="text-2xl font-semibold text-foreground">Settings</h1><p className="text-sm text-muted-foreground mt-1">Manage your workspace preferences</p></div>

      {[
        { icon: User, title: "Profile", fields: [
          { label: "Display Name", type: "input", placeholder: "John Doe" },
          { label: "Email", type: "input", placeholder: "john@example.com" },
        ]},
        { icon: Palette, title: "Appearance", fields: [
          { label: "Theme", type: "select", options: ["Dark", "Light", "System"] },
          { label: "Compact Mode", type: "switch" },
        ]},
        { icon: Bell, title: "Notifications", fields: [
          { label: "Email Notifications", type: "switch" },
          { label: "Usage Alerts", type: "switch" },
          { label: "Billing Alerts", type: "switch" },
        ]},
        { icon: Globe, title: "Workspace", fields: [
          { label: "Default Model", type: "select", options: ["GPT-4o", "Claude 3.5", "Gemini Pro"] },
          { label: "Default Region", type: "select", options: ["US East", "US West", "EU West", "Asia Pacific"] },
        ]},
      ].map(section => (
        <div key={section.title} className="glass-panel p-4 glow-border space-y-4">
          <div className="flex items-center gap-2"><section.icon className="h-4 w-4 text-muted-foreground" /><h2 className="text-sm font-medium text-foreground">{section.title}</h2></div>
          {section.fields.map(f => (
            <div key={f.label} className="flex items-center justify-between">
              <label className="text-xs text-muted-foreground">{f.label}</label>
              {f.type === "input" && <input className="h-8 w-56 px-3 rounded-md bg-secondary/30 border border-border/50 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50" placeholder={f.placeholder} />}
              {f.type === "switch" && <Switch />}
              {f.type === "select" && <Select defaultValue={f.options?.[0]}><SelectTrigger className="h-8 w-40 text-xs bg-secondary/30 border-border/50"><SelectValue /></SelectTrigger><SelectContent>{f.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent></Select>}
            </div>
          ))}
        </div>
      ))}
      <Button className="text-xs h-9">Save Changes</Button>
    </div>
  );
}
