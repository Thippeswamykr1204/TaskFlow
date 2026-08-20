"use client";

import { useDraggable } from "@dnd-kit/core";
import type { Task } from "@/types/task";
import { cn } from "@/lib/utils";

// Priority/label maps mirror TaskRow's — kept in sync manually since this is
// a compact variant of the same card, not a shared component.
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

export function KanbanCard({ task, onOpen }: { task: Task; onOpen: (taskId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={() => !isDragging && onOpen(task._id)}
      className={cn(
        "cursor-grab space-y-2 rounded-md border border-border bg-background px-3 py-2.5 shadow-sm transition-shadow active:cursor-grabbing",
        isDragging ? "z-10 opacity-60 shadow-md" : "hover:shadow-md",
      )}
    >
      <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-xs font-medium text-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", priorityDot[task.priority])} />
          {priorityLabel[task.priority]}
        </span>
        {task.dueDate && (
          <span className="font-mono text-xs text-muted-foreground">
            {new Date(task.dueDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
          </span>
        )}
      </div>
    </div>
  );
}