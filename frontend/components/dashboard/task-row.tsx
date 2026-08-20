import { MoreHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/types/task";
import { cn } from "@/lib/utils";

const priorityDot: Record<Task["priority"], string> = {
  LOW: "bg-priority-low",
  MEDIUM: "bg-priority-medium",
  HIGH: "bg-priority-high",
  URGENT: "bg-priority-high",
};

const priorityLabel: Record<Task["priority"], string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

const statusStyles: Record<Task["status"], string> = {
  IN_PROGRESS: "bg-status-in-progress-bg text-status-in-progress-fg",
  TODO: "bg-status-todo-bg text-status-todo-fg",
  BACKLOG: "bg-status-todo-bg text-status-todo-fg",
  DONE: "bg-status-in-progress-bg text-status-in-progress-fg",
};

const statusLabel: Record<Task["status"], string> = {
  IN_PROGRESS: "In Progress",
  TODO: "To Do",
  BACKLOG: "Pending",
  DONE: "Done",
};

export function TaskRow({ task }: { task: Task }) {
  return (
    <div className="flex items-center gap-4 border-b border-border px-1 py-4 last:border-b-0">
      <Checkbox disabled />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
        {task.tags[0] && <p className="text-xs text-muted-foreground">{task.tags[0]}</p>}
      </div>
      <span className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
        <span className={cn("h-1.5 w-1.5 rounded-full", priorityDot[task.priority])} />
        {priorityLabel[task.priority]}
      </span>
      {task.dueDate && (
        <span className="hidden font-mono text-xs text-muted-foreground sm:inline">
          {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      )}
      <span className={cn("rounded-full px-2.5 py-1 text-xs font-medium", statusStyles[task.status])}>
        {statusLabel[task.status]}
      </span>
      <button className="text-muted-foreground transition-colors hover:text-foreground" disabled aria-label="More options">
        <MoreHorizontal className="h-4 w-4" />
      </button>
    </div>
  );
}

export function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-border px-1 py-4 last:border-b-0">
      <span className="h-4 w-4 animate-pulse rounded bg-border" />
      <div className="flex-1 space-y-1.5">
        <span className="block h-3.5 w-48 animate-pulse rounded bg-border" />
        <span className="block h-3 w-20 animate-pulse rounded bg-border" />
      </div>
      <span className="h-6 w-16 animate-pulse rounded-full bg-border" />
      <span className="h-3 w-20 animate-pulse rounded bg-border" />
      <span className="h-6 w-20 animate-pulse rounded-full bg-border" />
    </div>
  );
}