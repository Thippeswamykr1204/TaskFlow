"use client";

import type { LucideIcon } from "lucide-react";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
  trend,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "primary" | "teal" | "danger";
  trend?: { direction: "up" | "down"; pct: number } | null;
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-secondary-accent/10 text-secondary-accent",
    danger: "bg-danger-bg text-danger",
  }[tone];

  const trendColor =
    trend?.direction === "up" ? "text-success" : "text-danger";
  const TrendIcon = trend?.direction === "up" ? TrendingUp : TrendingDown;

  return (
    <Card className="interactive group cursor-default overflow-hidden">
      <CardHeader className="flex-row items-start justify-between gap-3 pb-1">
        <div className="flex items-center gap-3">
          <span className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", toneClasses)}>
            <Icon className="h-4 w-4" />
          </span>
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        {trend && (
          <span className={cn("flex items-center gap-0.5 rounded-full px-2 py-0.5 text-[11px] font-medium", trendColor, "bg-current/10")}>
            <TrendIcon className="h-3 w-3" />
            {trend.pct}%
          </span>
        )}
      </CardHeader>
      <CardContent className="pt-1">
        <p className="animate-count-up font-heading text-3xl font-bold text-foreground">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 pb-0">
        <span className="h-9 w-9 animate-pulse rounded-lg bg-border" />
        <span className="h-4 w-20 animate-pulse rounded bg-border" />
      </CardHeader>
      <CardContent>
        <span className="block h-8 w-16 animate-pulse rounded bg-border" />
      </CardContent>
    </Card>
  );
}
