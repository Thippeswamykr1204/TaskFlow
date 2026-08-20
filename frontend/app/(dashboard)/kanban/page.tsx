"use client";

import { DndContext, useDroppable, useSensor, useSensors, PointerSensor, type DragEndEvent } from "@dnd-kit/core";
import { KanbanCard } from "@/components/dashboard/kanban-card";
import { TaskListError } from "@/components/dashboard/empty-state";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { useTasks, useUpdateTask } from "@/lib/hooks/use-tasks";
import { useUiStore } from "@/lib/store/ui-store";
import { taskStatusValues } from "@/lib/validation/task-schemas";
import type { Task, TaskStatus } from "@/types/task";
import { cn } from "@/lib/utils";

const columnLabel: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

function KanbanColumn({
  status,
  tasks,
  onOpenTask,
}: {
  status: TaskStatus;
  tasks: Task[];
  onOpenTask: (taskId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <div className="mb-3 flex items-center justify-between px-1">
        <h2 className="text-sm font-semibold text-foreground">{columnLabel[status]}</h2>
        <span className="rounded-full bg-border px-2 py-0.5 text-xs font-medium text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-[200px] flex-1 flex-col gap-2 rounded-lg border border-dashed border-border bg-background-secondary p-2 transition-colors",
          isOver && "border-primary bg-primary/5",
        )}
      >
        {tasks.length === 0 && (
          <p className="px-1 py-3 text-center text-xs text-muted-foreground">No tasks here.</p>
        )}
        {tasks.map((task) => (
          <KanbanCard key={task._id} task={task} onOpen={onOpenTask} />
        ))}
      </div>
    </div>
  );
}

export default function KanbanPage() {
  const openEditTaskModal = useUiStore((s) => s.openEditTaskModal);

  // No status filter, high limit so every task shows up on the board.
  const { data, isLoading, isError, refetch } = useTasks({ limit: 500 });
  const updateTask = useUpdateTask();

  // Require ~8px of pointer movement before a drag session starts, so a
  // plain click on a card (no meaningful movement) never gets treated as a
  // drag in the first place. Kept in sync with the click-vs-drag distance
  // check in KanbanCard.
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  );

  const tasksByStatus: Record<TaskStatus, Task[]> = {
    BACKLOG: [],
    TODO: [],
    IN_PROGRESS: [],
    DONE: [],
  };
  data?.data.forEach((task) => {
    tasksByStatus[task.status].push(task);
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const taskId = String(active.id);
    const newStatus = over.id as TaskStatus;
    const task = data?.data.find((t) => t._id === taskId);
    if (!task || task.status === newStatus) return;

    // Reuses the existing optimistic-update/rollback mutation — same path
    // every other status change in the app goes through.
    updateTask.mutate({ id: taskId, input: { status: newStatus } });
  };

  return (
    <div className="flex h-full flex-col">
      <h1 className="font-heading text-3xl font-bold text-foreground">Kanban</h1>
      <p className="mt-1 text-muted-foreground">Drag tasks between columns to update their status.</p>

      <div className="mt-8 flex-1">
        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {taskStatusValues.map((s) => (
              <div key={s} className="space-y-3">
                <span className="block h-4 w-20 animate-pulse rounded bg-border" />
                <div className="space-y-2 rounded-lg border border-dashed border-border p-2">
                  {[0, 1].map((i) => (
                    <span key={i} className="block h-16 animate-pulse rounded-md bg-border" />
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
                />
              ))}
            </div>
          </DndContext>
        )}
      </div>

      <TaskFormModal />
    </div>
  );
}