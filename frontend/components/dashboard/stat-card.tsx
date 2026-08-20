import type { LucideIcon } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatCard({
  icon: Icon,
  label,
  value,
  tone = "primary",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  tone?: "primary" | "teal" | "danger";
}) {
  const toneClasses = {
    primary: "bg-primary/10 text-primary",
    teal: "bg-secondary-accent/10 text-secondary-accent",
    danger: "bg-danger-bg text-danger",
  }[tone];

  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 pb-0">
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-md", toneClasses)}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="text-sm text-muted-foreground">{label}</span>
      </CardHeader>
      <CardContent>
        <p className="font-heading text-3xl font-bold text-foreground">{value}</p>
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-3 pb-0">
        <span className="h-9 w-9 animate-pulse rounded-md bg-border" />
        <span className="h-4 w-20 animate-pulse rounded bg-border" />
      </CardHeader>
      <CardContent>
        <span className="block h-8 w-16 animate-pulse rounded bg-border" />
      </CardContent>
    </Card>
  );
}