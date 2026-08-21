"use client";

import { MoreHorizontal, Clock, Tag, CheckSquare } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { WeatherChip } from "@/components/weather-chip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateTask } from "@/lib/hooks/use-tasks";
import type { Task } from "@/types/task";
import { cn } from "@/lib/utils";

// ─── Priority ────────────────────────────────────────────────────────────────
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

// ─── Status ──────────────────────────────────────────────────────────────────
const statusStyles: Record<Task["status"], string> = {
  IN_PROGRESS: "bg-status-in-progress-bg text-status-in-progress-fg",
  TODO: "bg-status-todo-bg text-status-todo-fg",
  BACKLOG: "bg-status-backlog-bg text-status-backlog-fg",
  DONE: "bg-status-done-bg text-status-done-fg",
};
const statusLabel: Record<Task["status"], string> = {
  IN_PROGRESS: "In Progress",
  TODO: "To Do",
  BACKLOG: "Backlog",
  DONE: "Done",
};

// ─── Relative date helper ─────────────────────────────────────────────────────
export function relativeDate(dateStr: string): { label: string; tone: "danger" | "warning" | "muted" } {
  const now = new Date();
  const due = new Date(dateStr);
  const diffDays = Math.round((due.setHours(0, 0, 0, 0) - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);

  if (diffDays < 0) return { label: `${Math.abs(diffDays)}d overdue`, tone: "danger" };
  if (diffDays === 0) return { label: "Due today", tone: "warning" };
  if (diffDays === 1) return { label: "Due tomorrow", tone: "warning" };
  if (diffDays <= 7) return { label: `Due in ${diffDays}d`, tone: "muted" };
  return {
    label: due.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    tone: "muted",
  };
}

const dueToneClasses = {
  danger: "text-danger",
  warning: "text-warning",
  muted: "text-muted-foreground",
};

// ─── Component ────────────────────────────────────────────────────────────────
export function TaskRow({ task }: { task: Task }) {
  const updateTask = useUpdateTask();

  const doneCount = task.subtasks.filter((s) => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const isDone = task.status === "DONE";

  const handleStatusChange = (status: Task["status"]) => {
    if (task.status === status) return;
    updateTask.mutate({ id: task._id, input: { status } });
  };

  return (
    <div className="group flex items-center gap-4 border-b border-border px-1 py-3.5 last:border-b-0 transition-colors duration-150 hover:bg-background-secondary/60 rounded-lg">
      {/* Checkbox */}
      <Checkbox checked={isDone} disabled aria-label={isDone ? "Task completed" : "Task not completed"} />

      {/* Title + meta */}
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-sm font-medium transition-all duration-150", isDone ? "text-muted-foreground line-through opacity-70" : "text-foreground")}>
          {task.title}
        </p>

        {/* Tags row */}
        {task.tags.length > 0 && (
          <div className="mt-1 flex items-center gap-1.5">
            <Tag className="h-3 w-3 text-muted-foreground/60 shrink-0" />
            {task.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-primary/8 px-2 py-0.5 text-[10px] font-medium text-primary"
              >
                {tag}
              </span>
            ))}
            {task.tags.length > 2 && (
              <span className="text-[10px] text-muted-foreground">+{task.tags.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Flexible items (Subtasks, Weather) */}
      <div className="hidden shrink-0 items-center gap-3 sm:flex">
        {totalSubtasks > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <CheckSquare className="h-3.5 w-3.5" />
            {doneCount}/{totalSubtasks}
          </span>
        )}
        {task.location?.city && <WeatherChip city={task.location.city} variant="pill" />}
      </div>

      {/* Rigid aligned columns (Priority, Due Date, Status) */}
      <div className="flex shrink-0 items-center gap-3">
        {/* Priority */}
        <div className="hidden w-24 sm:block">
          <span className="flex w-full items-center justify-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground">
            <span className={cn("h-1.5 w-1.5 rounded-full", priorityDot[task.priority])} />
            {priorityLabel[task.priority]}
          </span>
        </div>

        {/* Due date */}
        <div className="hidden w-28 sm:block">
          {task.dueDate && (() => {
            const { label, tone } = relativeDate(task.dueDate);
            return (
              <span className={cn("flex w-full items-center justify-start gap-1 text-xs font-medium", dueToneClasses[tone])}>
                <Clock className="h-3 w-3 shrink-0" />
                <span className="truncate">{label}</span>
              </span>
            );
          })()}
        </div>

        {/* Status badge dropdown */}
        <div onClick={(e) => e.stopPropagation()} className="w-28 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger className={cn("interactive flex w-full items-center justify-center rounded-full px-2.5 py-1 text-xs font-medium transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40", statusStyles[task.status])}>
              {statusLabel[task.status]}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {(Object.entries(statusLabel) as [Task["status"], string][]).map(([status, label]) => (
                <DropdownMenuItem
                  key={status}
                  className="gap-2 cursor-pointer"
                  onClick={() => handleStatusChange(status)}
                >
                  <span className={cn("h-2 w-2 rounded-full", statusStyles[status].split(" ")[0])} />
                  {label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* More */}
        <div className="flex w-6 justify-end">
          <button
            className="text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
            disabled
            aria-label="More options"
          >
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

export function TaskRowSkeleton() {
  return (
    <div className="flex items-center gap-4 border-b border-border px-1 py-3.5 last:border-b-0">
      <span className="h-4 w-4 animate-pulse rounded bg-border" />
      <div className="flex-1 space-y-2">
        <span className="block h-3.5 w-48 animate-pulse rounded bg-border" />
        <span className="block h-3 w-24 animate-pulse rounded bg-border" />
      </div>
      <span className="hidden h-5 w-14 animate-pulse rounded-full bg-border sm:block" />
      <span className="hidden h-4 w-20 animate-pulse rounded bg-border sm:block" />
      <span className="h-5 w-20 animate-pulse rounded-full bg-border" />
    </div>
  );
}
