import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useSidebar } from "@/components/ui/sidebar";
import { useAuth } from "@/contexts/AuthContext";

function getInitials(name: string | undefined, email: string | undefined): string {
  const source = (name?.trim() || email?.trim() || "U").split(" ");
  if (source.length === 1) return source[0].slice(0, 2).toUpperCase();
  return `${source[0][0] ?? ""}${source[1][0] ?? ""}`.toUpperCase();
}

export function SidebarUser() {
  const navigate = useNavigate();
  const { state } = useSidebar();
  const { user, logout } = useAuth();
  const collapsed = state === "collapsed";

  const initials = useMemo(() => getInitials(user?.name, user?.email), [user?.email, user?.name]);

  const onLogout = () => {
    logout();
    navigate("/login");
  };

  const onProfile = () => {
    navigate("/profile");
  };

  return (
    <div className="px-3 pb-3">
      <Separator className="mb-3" />
      <div className="rounded-lg border border-border/60 bg-card/50 p-3">
        <div className="flex items-center gap-3">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{user?.name ?? "Пользователь"}</p>
              <p className="truncate text-xs text-muted-foreground">{user?.email ?? "—"}</p>
              <Badge variant="secondary" className="mt-1 text-[10px] uppercase">
                {user?.role ?? "guest"}
              </Badge>
            </div>
          )}
        </div>

        <div className={`mt-3 grid gap-2 ${collapsed ? "grid-cols-1" : "grid-cols-2"}`}>
          <Button type="button" variant="outline" size={collapsed ? "icon" : "sm"} onClick={onProfile} className="w-full">
            <User className="h-4 w-4" />
            {!collapsed && <span>Profile</span>}
          </Button>
          <Button type="button" variant="destructive" size={collapsed ? "icon" : "sm"} onClick={onLogout} className="w-full">
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Logout</span>}
          </Button>
        </div>
      </div>
    </div>
  );
}
