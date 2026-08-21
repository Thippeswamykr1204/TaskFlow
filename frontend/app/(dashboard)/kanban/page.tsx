"use client";

import { DndContext, useDroppable, useSensor, useSensors, PointerSensor, type DragEndEvent } from "@dnd-kit/core";
import { KanbanCard } from "@/components/dashboard/kanban-card";
import { TaskListError } from "@/components/dashboard/empty-state";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { useAllTasks, useUpdateTask } from "@/lib/hooks/use-tasks";
import { useUiStore } from "@/lib/store/ui-store";
import { taskStatusValues } from "@/lib/validation/task-schemas";
import type { Task, TaskStatus } from "@/types/task";
import { cn } from "@/lib/utils";
import { Archive, Circle, Zap, CheckCircle2, Plus } from "lucide-react";

// ─── Column metadata ──────────────────────────────────────────────────────────
const columnMeta: Record<
  TaskStatus,
  { label: string; icon: React.ElementType; accentColor: string; headerBg: string; countBg: string }
> = {
  BACKLOG: {
    label: "Backlog",
    icon: Archive,
    accentColor: "border-t-[var(--kanban-backlog)]",
    headerBg: "text-[var(--status-backlog-fg)]",
    countBg: "bg-[var(--status-backlog-bg)] text-[var(--status-backlog-fg)]",
  },
  TODO: {
    label: "To Do",
    icon: Circle,
    accentColor: "border-t-[var(--kanban-todo)]",
    headerBg: "text-[var(--status-todo-fg)]",
    countBg: "bg-[var(--status-todo-bg)] text-[var(--status-todo-fg)]",
  },
  IN_PROGRESS: {
    label: "In Progress",
    icon: Zap,
    accentColor: "border-t-[var(--kanban-in-progress)]",
    headerBg: "text-[var(--status-in-progress-fg)]",
    countBg: "bg-[var(--status-in-progress-bg)] text-[var(--status-in-progress-fg)]",
  },
  DONE: {
    label: "Done",
    icon: CheckCircle2,
    accentColor: "border-t-[var(--kanban-done)]",
    headerBg: "text-[var(--status-done-fg)]",
    countBg: "bg-[var(--status-done-bg)] text-[var(--status-done-fg)]",
  },
};

// ─── Empty column illustration ────────────────────────────────────────────────
function EmptyColumn({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border/60 bg-background-secondary/30 px-4 py-8 text-center">
      {/* Ghost SVG */}
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <rect x="8" y="16" width="24" height="16" rx="4" stroke="currentColor" strokeWidth="1.5" className="text-border" />
        <rect x="12" y="8" width="16" height="10" rx="3" stroke="currentColor" strokeWidth="1.5" className="text-border" />
        <circle cx="16" cy="22" r="1.5" fill="currentColor" className="text-muted-foreground/40" />
        <circle cx="24" cy="22" r="1.5" fill="currentColor" className="text-muted-foreground/40" />
        <path d="M16 26 Q20 29 24 26" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="text-muted-foreground/40" />
      </svg>
      <p className="text-xs text-muted-foreground/70">No {label.toLowerCase()} tasks</p>
      <p className="text-[11px] text-muted-foreground/40">Drop tasks here</p>
    </div>
  );
}

// ─── Column ───────────────────────────────────────────────────────────────────
function KanbanColumn({
  status,
  tasks,
  onOpenTask,
  onNewTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
  onNewTask: () => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const meta = columnMeta[status];
  const Icon = meta.icon;

  return (
    <div className={cn("flex min-w-0 flex-1 flex-col rounded-xl border border-t-[3px] border-border bg-background shadow-sm", meta.accentColor)}>
      {/* Column header */}
      <div className="flex items-center justify-between px-3 py-3">
        <div className="flex items-center gap-2">
          <Icon className={cn("h-4 w-4", meta.headerBg)} />
          <h2 className={cn("text-sm font-semibold", meta.headerBg)}>{meta.label}</h2>
          <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", meta.countBg)}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={onNewTask}
          title={`New ${meta.label} task`}
          className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-background-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          "mx-2 mb-2 flex flex-1 flex-col gap-2 rounded-lg p-2 transition-all duration-150 min-h-[180px]",
          isOver
            ? "border border-primary/60 bg-primary/5 ring-1 ring-primary/30"
            : "border border-transparent",
        )}
      >
        {tasks.length === 0 && !isOver && <EmptyColumn label={meta.label} />}
        {tasks.map((task) => (
          <KanbanCard key={task._id} task={task} onOpen={onOpenTask} />
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function KanbanPage() {
  const openEditTaskModal = useUiStore((s) => s.openEditTaskModal);
  const openCreateTaskModal = useUiStore((s) => s.openCreateTaskModal);

  const { data, isLoading, isError, refetch } = useAllTasks();
  const updateTask = useUpdateTask();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  data?.forEach((task) => {
    tasksByStatus[task.status].push(task);
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const taskId = String(active.id);
    const newStatus = over.id as TaskStatus;
    const task = data?.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;
    updateTask.mutate({ id: taskId, input: { status: newStatus } });
  };

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">Kanban Board</h1>
          <p className="mt-1 text-sm text-muted-foreground">Drag tasks between columns to update their status.</p>
        </div>
        <button
          onClick={openCreateTaskModal}
          className="interactive flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        >
          <Plus className="h-4 w-4" />
          New Task
        </button>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {taskStatusValues.map((s) => (
            <div key={s} className="rounded-xl border border-t-[3px] border-border bg-background p-3 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 animate-pulse rounded bg-border" />
                <span className="h-4 w-20 animate-pulse rounded bg-border" />
              </div>
              <div className="space-y-2">
                {[0, 1].map((i) => (
                  <span key={i} className="block h-20 animate-pulse rounded-lg bg-border" />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isError && <TaskListError onRetry={() => refetch()} />}

      {data && (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {taskStatusValues.map((status) => (
              <KanbanColumn
                key={status}
                status={status}
                tasks={tasksByStatus[status]}
                onOpenTask={openEditTaskModal}
                onNewTask={openCreateTaskModal}
              />
            ))}
          </div>
        </DndContext>
      )}

      <TaskFormModal />
    </div>
  );
}
