import { ClipboardList, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function TaskListEmpty() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
        <ClipboardList className="h-6 w-6" />
      </span>
      <p className="text-sm text-muted-foreground">Nothing scheduled for today. Enjoy the breathing room.</p>
      <Button size="sm" variant="outline" disabled title="Coming in a later tier">
        Create your first task
      </Button>
    </div>
  );
}

export function TaskListError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-danger-bg text-danger">
        <AlertCircle className="h-6 w-6" />
      </span>
      <p className="text-sm text-muted-foreground">Couldn&apos;t load your tasks. Please try again.</p>
      <Button size="sm" variant="outline" onClick={onRetry}>
        Retry
      </Button>
    </div>
  );
}