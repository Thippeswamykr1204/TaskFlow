import { Check } from "lucide-react";

export function SessionLoadingScreen() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center gap-6 bg-background">
      <div className="relative flex h-20 w-20 items-center justify-center rounded-2xl border-2 border-primary">
        <div className="absolute inset-0 -z-10 rounded-2xl bg-primary/20 blur-2xl" />
        <Check className="h-9 w-9 text-primary" strokeWidth={2.5} />
      </div>
      <span className="font-heading text-3xl font-bold tracking-tight">
        <span className="text-foreground">Task</span>
        <span className="text-primary">Flow</span>
      </span>
      <p className="text-sm text-muted-foreground">Checking your session…</p>
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary/30 [animation-delay:0ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary [animation-delay:150ms]" />
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary/30 [animation-delay:300ms]" />
      </div>
    </div>
  );
}