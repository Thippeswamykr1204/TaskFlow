"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, ListChecks, Kanban, BarChart3, Settings, PanelLeft } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/logo";
import { useUiStore } from "@/lib/store/ui-store";
import { cn } from "@/lib/utils";

const navItems: { label: string; href: string; icon: LucideIcon; soon?: boolean }[] = [
  { label: "Overview", href: "/dashboard", icon: LayoutGrid },
  { label: "My Tasks", href: "/tasks", icon: ListChecks },
  { label: "Kanban", href: "/kanban", icon: Kanban },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        "relative flex h-screen shrink-0 flex-col border-r border-border bg-background-secondary transition-all duration-300 ease-in-out",
        collapsed ? "w-[68px]" : "w-64",
      )}
    >
      {/* Header */}
      <div className={cn("flex h-16 items-center border-b border-border", collapsed ? "justify-center px-3" : "justify-between px-5")}>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.15 }}
            >
              <Logo markClassName="h-7 w-7" className="gap-2" />
            </motion.div>
          )}
        </AnimatePresence>
        <button
          onClick={toggleSidebar}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn(
            "flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:bg-background hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            collapsed && "mx-auto",
          )}
        >
          <PanelLeft className={cn("h-4 w-4 transition-transform duration-300", collapsed && "rotate-180")} />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-2.5 pt-4">
        {navItems.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.soon ? "#" : item.href}
              aria-disabled={item.soon}
              aria-current={active ? "page" : undefined}
              title={collapsed ? item.label : undefined}
              onClick={(e) => item.soon && e.preventDefault()}
              className={cn(
                "interactive relative flex items-center rounded-lg px-2.5 py-2.5 text-sm font-medium transition-colors duration-150 focus-ring focus-visible:rounded-lg",
                active
                  ? "text-primary"
                  : item.soon
                    ? "cursor-not-allowed text-muted-foreground/50"
                    : "text-muted-foreground hover:bg-background hover:text-foreground",
                collapsed && "justify-center",
              )}
            >
              {/* Sliding active background pill */}
              {active && (
                <motion.span
                  layoutId="sidebar-active-pill"
                  className="absolute inset-0 rounded-lg bg-primary/10"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}

              <span className={cn("relative z-10 flex items-center", collapsed ? "gap-0" : "gap-3")}>
                <Icon className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "")} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </span>

              {!collapsed && item.soon && (
                <span className="relative z-10 ml-auto rounded-full bg-border px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Soon
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Bottom: version hint */}
      {!collapsed && (
        <div className="mt-auto px-4 py-5">
          <p className="text-[11px] text-muted-foreground/50 select-none">TaskFlow v1.0</p>
        </div>
      )}
    </aside>
  );
}
