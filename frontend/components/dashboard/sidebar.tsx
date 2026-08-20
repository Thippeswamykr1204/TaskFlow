"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ListChecks, Kanban, BarChart3, Settings, ChevronsLeft } from "lucide-react";
import { Logo } from "@/components/logo";
import { useUiStore } from "@/lib/store/ui-store";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutGrid },
  { label: "My Tasks", href: "/tasks", icon: ListChecks },
  { label: "Kanban", href: "#", icon: Kanban, soon: true },
  { label: "Analytics", href: "#", icon: BarChart3, soon: true },
  { label: "Settings", href: "#", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "flex h-screen shrink-0 flex-col border-r border-border bg-background-secondary transition-all",
        collapsed ? "w-20" : "w-64",
      )}
    >
      <div className="flex items-center justify-between px-5 py-6">
        {!collapsed && <Logo markClassName="h-8 w-8" className="gap-2" />}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronsLeft className={cn("h-4 w-4 transition-transform", collapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex flex-col gap-1 px-3">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.soon ? "#" : item.href}
              aria-disabled={item.soon}
              onClick={(e) => item.soon && e.preventDefault()}
              className={cn(
                "flex items-center justify-between rounded-md px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-primary/10 text-primary"
                  : item.soon
                    ? "cursor-not-allowed text-muted-foreground/70"
                    : "text-foreground hover:bg-background hover:text-primary",
              )}
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4" />
                {!collapsed && item.label}
              </span>
              {!collapsed && item.soon && (
                <span className="rounded-full bg-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}