"use client";

import { usePathname } from "next/navigation";
import { Bell, ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/auth-store";
import { useLogout } from "@/lib/hooks/use-logout";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

const pageTitles: Record<string, string> = {
  "/dashboard": "Overview",
  "/tasks": "My Tasks",
  "/kanban": "Kanban Board",
  "/analytics": "Analytics",
  "/settings": "Settings",
};

export function Topbar() {
  const user = useAuthStore((s) => s.user);
  const handleLogout = useLogout();
  const pathname = usePathname();
  const pageTitle = pageTitles[pathname] ?? "Dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center border-b border-border bg-background/80 px-6 backdrop-blur-sm">
      {/* Page breadcrumb */}
      <div className="flex items-center gap-2.5">
        <span className="font-heading text-lg font-semibold text-foreground">{pageTitle}</span>
      </div>

      {/* Right actions */}
      <div className="ml-auto flex items-center gap-4">
        {/* Notification bell */}
        <button
          className="interactive relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-background-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          aria-label="Notifications"
        >
          <Bell className="h-4.5 w-4.5" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary ring-2 ring-background" />
        </button>

        {/* Divider */}
        <span className="h-5 w-px bg-border" />

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger className="interactive flex items-center gap-2.5 rounded-lg px-2 py-1.5 outline-none transition-colors hover:bg-background-secondary focus-visible:ring-2 focus-visible:ring-primary/40">
            <Avatar className="h-7 w-7">
              <AvatarFallback className="bg-primary/10 text-[11px] font-semibold text-primary">
                {user ? initials(user.name) : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="hidden text-sm font-medium text-foreground sm:inline">{user?.name}</span>
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[160px]">
            <div className="px-3 py-2 border-b border-border mb-1">
              <p className="text-xs font-medium text-foreground truncate">{user?.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem onClick={handleLogout} className="text-danger focus:text-danger focus:bg-danger-bg">
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
