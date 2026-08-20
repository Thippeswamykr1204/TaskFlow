"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { X, Plus, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ErrorBanner } from "@/components/auth/error-banner";
import { WeatherChip } from "@/components/weather-chip";
import { TaskAttachments } from "@/components/tasks/task-attachments";
import { TaskActivity } from "@/components/tasks/task-activity";
import { useUiStore } from "@/lib/store/ui-store";
import { useCreateTask, useUpdateTask, useDeleteTask, useTasks } from "@/lib/hooks/use-tasks";
import { taskFormSchema, taskStatusValues, priorityValues, type TaskFormValues } from "@/lib/validation/task-schemas";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@/types/task";

const statusLabel: Record<(typeof taskStatusValues)[number], string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityLabel: Record<(typeof priorityValues)[number], string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

function toFormValues(task?: Task): TaskFormValues {
  if (!task) {
    return {
      title: "",
      description: "",
      status: "BACKLOG",
      priority: "MEDIUM",
      dueDate: "",
      city: "",
      tags: [],
      subtasks: [],
    };
  }
  return {
    title: task.title,
    description: task.description ?? "",
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ? task.dueDate.slice(0, 10) : "",
    city: task.location?.city ?? "",
    tags: task.tags,
    subtasks: task.subtasks.map((s) => ({ _id: s._id, title: s.title, done: s.done })),
  };
}

function toApiInput(values: TaskFormValues): CreateTaskInput {
  return {
    title: values.title,
    description: values.description || undefined,
    status: values.status,
    priority: values.priority,
    dueDate: values.dueDate ? new Date(values.dueDate).toISOString() : undefined,
    location: values.city ? { city: values.city } : undefined,
    tags: values.tags,
    subtasks: values.subtasks,
  };
}

export function TaskFormModal() {
  const taskModalOpen = useUiStore((s) => s.taskModalOpen);
  const editingTaskId = useUiStore((s) => s.editingTaskId);
  const closeTaskModal = useUiStore((s) => s.closeTaskModal);
  const filters = useUiStore((s) => s.taskFilters);
  const page = useUiStore((s) => s.taskPage);

  // Find the task being edited from the currently-loaded list page — avoids a second fetch.
  const list = useTasks({ page, limit: 20, ...normalizeFilters(filters) });
  const editingTask = editingTaskId ? list.data?.data.find((t) => t._id === editingTaskId) : undefined;
  const isEdit = !!editingTaskId;

  const createTask = useCreateTask();
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();

  const [apiError, setApiError] = useState<string | null>(null);
  const [tagDraft, setTagDraft] = useState("");
  const [subtaskDraft, setSubtaskDraft] = useState("");
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: toFormValues(editingTask),
  });

  useEffect(() => {
    if (taskModalOpen) {
      reset(toFormValues(editingTask));
      setApiError(null);
      setConfirmingDelete(false);
      setTagDraft("");
      setSubtaskDraft("");
    }
    // Only re-run when the modal opens or the target task changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [taskModalOpen, editingTaskId]);

  const description = watch("description") ?? "";
  const tags = watch("tags");
  const subtasks = watch("subtasks");
  const city = watch("city");

  const onSubmit = async (values: TaskFormValues) => {
    setApiError(null);
    try {
      if (isEdit && editingTaskId) {
        await updateTask.mutateAsync({ id: editingTaskId, input: toApiInput(values) as UpdateTaskInput });
      } else {
        await createTask.mutateAsync(toApiInput(values));
      }
      closeTaskModal();
    } catch (err) {
      setApiError(extractErrorMessage(err));
    }
  };

  const handleDelete = async () => {
    if (!editingTaskId) return;
    try {
      await deleteTask.mutateAsync(editingTaskId);
      closeTaskModal();
    } catch (err) {
      setApiError(extractErrorMessage(err));
    }
  };

  // Toggle a subtask's done state — in edit mode, fire the optimistic update immediately.
  const toggleSubtask = (index: number) => {
    const next = subtasks.map((s, i) => (i === index ? { ...s, done: !s.done } : s));
    setValue("subtasks", next);
    if (isEdit && editingTaskId) {
      updateTask.mutate({ id: editingTaskId, input: { subtasks: next } });
    }
  };

  const addTag = () => {
    const t = tagDraft.trim();
    if (!t || tags.includes(t)) return;
    setValue("tags", [...tags, t]);
    setTagDraft("");
  };

  const addSubtask = () => {
    const t = subtaskDraft.trim();
    if (!t) return;
    setValue("subtasks", [...subtasks, { title: t, done: false }]);
    setSubtaskDraft("");
  };

  return (
    <Dialog open={taskModalOpen} onOpenChange={(open) => !open && closeTaskModal()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription>
            {isEdit ? "Update the task details below." : "Fill in the details for your new task."}
          </DialogDescription>
        </DialogHeader>

        {apiError && (
          <div className="mb-4">
            <ErrorBanner message={apiError} onDismiss={() => setApiError(null)} />
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="title">Title</Label>
            <Input id="title" {...register("title")} />
            {errors.title && <p className="text-xs text-danger">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              rows={4}
              maxLength={5000}
              {...register("description")}
              className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary"
            />
            {description.length > 4500 && (
              <p className="text-xs text-muted-foreground">{description.length}/5000</p>
            )}
            {errors.description && <p className="text-xs text-danger">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                {...register("status")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {taskStatusValues.map((s) => (
                  <option key={s} value={s}>
                    {statusLabel[s]}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="priority">Priority</Label>
              <select
                id="priority"
                {...register("priority")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                style={{ color: `var(--priority-${watch("priority").toLowerCase()}, var(--foreground))` }}
              >
                {priorityValues.map((p) => (
                  <option key={p} value={p}>
                    {priorityLabel[p]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="dueDate">Due date</Label>
            <Input id="dueDate" type="date" {...register("dueDate")} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" placeholder="San Francisco" {...register("city")} />
            <p className="text-xs text-muted-foreground">Used to show local weather.</p>
            {city && (
              <div className="pt-1">
                <WeatherChip city={city} variant="field" />
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <Label>Tags</Label>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => (
                <span key={t} className="flex items-center gap-1 rounded-full border border-border px-2.5 py-1 text-xs">
                  {t}
                  <button type="button" onClick={() => setValue("tags", tags.filter((x) => x !== t))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <Input
              placeholder="Type a tag, press Enter"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTag();
                }
              }}
            />
          </div>

          <div className="space-y-1.5">
            <Label>Subtasks</Label>
            <div className="space-y-2">
              {subtasks.map((s, i) => (
                <div key={s._id ?? i} className="flex items-center gap-2">
                  <Checkbox checked={s.done} onCheckedChange={() => toggleSubtask(i)} />
                  <span className={s.done ? "flex-1 text-sm text-muted-foreground line-through" : "flex-1 text-sm"}>
                    {s.title}
                  </span>
                  <button
                    type="button"
                    onClick={() => setValue("subtasks", subtasks.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-danger"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Add a subtask, press Enter"
                value={subtaskDraft}
                onChange={(e) => setSubtaskDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSubtask();
                  }
                }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addSubtask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {isEdit && editingTaskId && <TaskAttachments taskId={editingTaskId} />}

          {isEdit && editingTaskId && (
            <TaskActivity taskId={editingTaskId} enabled={taskModalOpen} />
          )}

          <div className="flex items-center justify-between pt-2">
            {isEdit ? (
              confirmingDelete ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-muted-foreground">Delete this task?</span>
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingDelete(false)}>
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    className="bg-danger text-primary-foreground hover:bg-danger"
                    onClick={handleDelete}
                    disabled={deleteTask.isPending}
                  >
                    {deleteTask.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" size="sm" className="text-danger" onClick={() => setConfirmingDelete(true)}>
                  Delete
                </Button>
              )
            ) : (
              <span />
            )}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Create Task"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function normalizeFilters(f: ReturnType<typeof useUiStore.getState>["taskFilters"]) {
  return {
    status: f.status === "ALL" ? undefined : f.status,
    priority: f.priority === "ALL" ? undefined : f.priority,
    search: f.search || undefined,
    startDate: f.startDate || undefined,
    endDate: f.endDate || undefined,
    sortBy: f.sortBy,
    sortOrder: f.sortOrder,
  };
}

function extractErrorMessage(err: unknown): string {
  if (isAxiosError(err) && err.response?.data?.message) {
    const msg = err.response.data.message;
    return Array.isArray(msg) ? msg[0] : msg;
  }
  return "Something went wrong. Please try again.";
}