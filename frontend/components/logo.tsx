import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, markClassName }: { className?: string; markClassName?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <span
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-lg border-2 border-primary text-primary",
          markClassName,
        )}
      >
        <Check className="h-5 w-5" strokeWidth={2.75} />
      </span>
      <span className="font-heading text-2xl font-bold tracking-tight">
        <span className="text-foreground">Task</span>
        <span className="text-primary">Flow</span>
      </span>
    </div>
  );
}