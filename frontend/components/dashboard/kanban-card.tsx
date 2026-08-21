"use client";

import { useRef } from "react";
import type React from "react";
import { useDraggable } from "@dnd-kit/core";
import { Clock, Tag } from "lucide-react";
import type { Task } from "@/types/task";
import { relativeDate } from "@/components/dashboard/task-row";
import { cn } from "@/lib/utils";

// ─── Click vs drag threshold (kept in sync with PointerSensor distance) ──────
const CLICK_MOVEMENT_THRESHOLD_PX = 5;

// ─── Maps ─────────────────────────────────────────────────────────────────────
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
const priorityBorder: Record<Task["priority"], string> = {
  LOW: "border-l-priority-low",
  MEDIUM: "border-l-priority-medium",
  HIGH: "border-l-priority-high",
  URGENT: "border-l-priority-high",
};

const dueToneClasses = {
  danger: "text-danger",
  warning: "text-warning",
  muted: "text-muted-foreground",
};

// ─── Component ────────────────────────────────────────────────────────────────
export function KanbanCard({ task, onOpen }: { task: Task; onOpen: (taskId: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task._id,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  const pointerDownPos = useRef<{ x: number; y: number } | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    pointerDownPos.current = { x: e.clientX, y: e.clientY };
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const start = pointerDownPos.current;
    pointerDownPos.current = null;
    if (start) {
      const dx = e.clientX - start.x;
      const dy = e.clientY - start.y;
      if (Math.sqrt(dx * dx + dy * dy) > CLICK_MOVEMENT_THRESHOLD_PX) return;
    }
    onOpen(task._id);
  };

  const doneCount = task.subtasks.filter((s) => s.done).length;
  const totalSubtasks = task.subtasks.length;
  const subtaskPct = totalSubtasks > 0 ? Math.round((doneCount / totalSubtasks) * 100) : 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onPointerDown={(e) => {
        handlePointerDown(e);
        listeners?.onPointerDown?.(e);
      }}
      onClick={handleClick}
      className={cn(
        "group cursor-grab select-none space-y-2.5 rounded-lg border border-l-[3px] border-border bg-background px-3 py-3 shadow-sm transition-all duration-150",
        priorityBorder[task.priority],
        isDragging
          ? "z-10 rotate-1 opacity-50 shadow-xl"
          : "hover:shadow-md hover:scale-[1.01] active:cursor-grabbing",
      )}
    >
      {/* Title */}
      <p className="truncate text-sm font-medium text-foreground leading-snug">{task.title}</p>

      {/* Tags */}
      {task.tags.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="h-3 w-3 text-muted-foreground/50 shrink-0" />
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

      {/* Subtask progress bar */}
      {totalSubtasks > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-muted-foreground">{doneCount}/{totalSubtasks} subtasks</span>
            <span className="text-[10px] text-muted-foreground">{subtaskPct}%</span>
          </div>
          <div className="h-1 w-full rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-secondary-accent transition-all duration-300"
              style={{ width: `${subtaskPct}%` }}
            />
          </div>
        </div>
      )}

      {/* Footer: priority + due date */}
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-1.5 rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
          <span className={cn("h-1.5 w-1.5 rounded-full", priorityDot[task.priority])} />
          {priorityLabel[task.priority]}
        </span>

        {task.dueDate && (() => {
          const { label, tone } = relativeDate(task.dueDate);
          return (
            <span className={cn("flex items-center gap-1 text-[11px] font-medium", dueToneClasses[tone])}>
              <Clock className="h-3 w-3 shrink-0" />
              {label}
            </span>
          );
        })()}
      </div>
    </div>
  );
}