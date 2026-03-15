import {
  LayoutDashboard, MessageSquare, Image, Mic, BarChart3, Bot, Wrench, Database,
  Key, CreditCard, Coins, HardDrive, FileText, Activity, Zap, ShoppingBag, Settings, Layers,
  Video, Waves, Radio, Sparkles
} from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useLocation } from "react-router-dom";
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, useSidebar,
} from "@/components/ui/sidebar";

const navGroups = [
  {
    label: "Core",
    items: [
      { title: "Dashboard", url: "/", icon: LayoutDashboard },
      { title: "AI Studio", url: "/ai-studio", icon: MessageSquare },
      { title: "Media Studio", url: "/media-studio", icon: Image },
    ],
  },
  {
    label: "AI Assistants",
    items: [
      { title: "Video Assistant", url: "/video-assistant", icon: Video },
      { title: "Voice Assistant", url: "/voice-assistant", icon: Waves },
      { title: "Live AI Mode", url: "/live-ai", icon: Radio },
      { title: "Multimodal Chat", url: "/multimodal-chat", icon: Sparkles },
    ],
  },
  {
    label: "Creation",
    items: [
      { title: "Voice Studio", url: "/voice-studio", icon: Mic },
      { title: "Data Analysis", url: "/data-analysis", icon: BarChart3 },
    ],
  },
  {
    label: "Orchestration",
    items: [
      { title: "Agents", url: "/agents", icon: Bot },
      { title: "Tools", url: "/tools", icon: Wrench },
      { title: "Datasets", url: "/datasets", icon: Database },
      { title: "Models", url: "/models", icon: Layers },
    ],
  },
  {
    label: "Infrastructure",
    items: [
      { title: "API Keys", url: "/api-keys", icon: Key },
      { title: "Usage & Billing", url: "/usage", icon: CreditCard },
      { title: "API Tokens", url: "/api-tokens", icon: Coins },
      { title: "Storage", url: "/storage", icon: HardDrive },
      { title: "Logs", url: "/logs", icon: FileText },
      { title: "Monitoring", url: "/monitoring", icon: Activity },
    ],
  },
  {
    label: "Pro",
    items: [
      { title: "AI Gateway Pro", url: "/gateway-pro", icon: Zap },
      { title: "Marketplace", url: "/marketplace", icon: ShoppingBag },
      { title: "Settings", url: "/settings", icon: Settings },
    ],
  },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const location = useLocation();

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarHeader className="p-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary">
            <Zap className="h-4 w-4 text-primary-foreground" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-foreground">AI Gateway</span>
              <span className="text-[10px] text-muted-foreground">Platform</span>
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent className="scrollbar-thin">
        {navGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => {
                  const active = location.pathname === item.url;
                  return (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton asChild isActive={active}>
                        <NavLink
                          to={item.url}
                          end
                          className="relative flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                          activeClassName="bg-accent text-foreground"
                        >
                          {active && (
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-0.5 rounded-full bg-primary" />
                          )}
                          <item.icon className="h-4 w-4 shrink-0" />
                          {!collapsed && <span>{item.title}</span>}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
