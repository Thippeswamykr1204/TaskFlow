"use client";

import { useRouter } from "next/navigation";
import { Search, Bell, ChevronDown, LogOut } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/lib/store/auth-store";
import { logoutRequest } from "@/lib/api/auth";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");
}

export function Topbar() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const handleLogout = async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
      router.replace("/login");
    }
  };

  return (
    <header className="flex h-16 items-center justify-between border-b border-border bg-background px-6">
      <div className="relative w-full max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search tasks..."
          disabled
          className="h-10 w-full rounded-md border border-border bg-background pl-9 pr-14 text-sm text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed"
        />
        <span className="absolute right-2 top-1/2 -translate-y-1/2 rounded border border-border bg-background-secondary px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </span>
      </div>

      <div className="flex items-center gap-5">
        <button className="relative text-muted-foreground transition-colors hover:text-foreground" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary" />
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 outline-none">
            <Avatar>
              <AvatarFallback>{user ? initials(user.name) : "?"}</AvatarFallback>
            </Avatar>
            <span className="text-sm font-medium text-foreground">{user?.name}</span>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}