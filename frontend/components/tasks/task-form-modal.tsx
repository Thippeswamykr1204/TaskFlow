"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { isAxiosError } from "axios";
import { X, Plus, Trash2, MapPin, ChevronDown } from "lucide-react";
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
import { cn } from "@/lib/utils";

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
    return { title: "", description: "", status: "BACKLOG", priority: "MEDIUM", dueDate: "", city: "", tags: [], subtasks: [] };
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

// ─── Field wrapper with error state ──────────────────────────────────────────
function Field({ label, htmlFor, error, children, hint }: {
  label: string;
  htmlFor?: string;
  error?: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className={cn(error && "text-danger")}>{label}</Label>
      <div className={cn(error && "[&>input]:border-danger [&>input]:focus-visible:ring-danger/30 [&>select]:border-danger [&>textarea]:border-danger")}>
        {children}
      </div>
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
}

export function TaskFormModal() {
  const taskModalOpen = useUiStore((s) => s.taskModalOpen);
  const editingTaskId = useUiStore((s) => s.editingTaskId);
  const closeTaskModal = useUiStore((s) => s.closeTaskModal);
  const filters = useUiStore((s) => s.taskFilters);
  const page = useUiStore((s) => s.taskPage);

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
  const [cityOpen, setCityOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: toFormValues(editingTask),
  });

  const initializedForRef = useRef<string | null>(null);

  useEffect(() => {
    if (!taskModalOpen) {
      initializedForRef.current = null;
      return;
    }
    const target = editingTaskId ?? "create";
    if (initializedForRef.current === target) return;
    if (isEdit && !editingTask && list.isLoading) return;

    const vals = toFormValues(editingTask);
    reset(vals);
    setApiError(null);
    setConfirmingDelete(false);
    setTagDraft("");
    setSubtaskDraft("");
    // Expand city section if editing and city already set
    setCityOpen(isEdit && !!vals.city);
    initializedForRef.current = target;
  }, [taskModalOpen, editingTaskId, editingTask, isEdit, list.isLoading, reset]);

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
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden p-0 gap-0">
        {/* Modal header */}
        <DialogHeader className="shrink-0 border-b border-border px-6 pt-6 pb-4">
          <DialogTitle className="font-heading text-xl">{isEdit ? "Edit Task" : "New Task"}</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {isEdit ? "Update the task details below." : "Fill in the details for your new task."}
          </DialogDescription>
        </DialogHeader>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {apiError && (
            <ErrorBanner message={apiError} onDismiss={() => setApiError(null)} />
          )}

          <Field label="Title" htmlFor="title" error={errors.title?.message}>
            <Input
              id="title"
              {...register("title")}
              className={cn(errors.title && "border-danger focus-visible:ring-danger/30")}
            />
          </Field>

          <Field label="Description" htmlFor="description" error={errors.description?.message}>
            <textarea
              id="description"
              rows={3}
              maxLength={5000}
              {...register("description")}
              className={cn(
                "flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary",
                errors.description && "border-danger focus-visible:ring-danger/30",
              )}
            />
            {description.length > 4500 && (
              <p className="text-xs text-muted-foreground mt-1">{description.length}/5000</p>
            )}
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Status" htmlFor="status">
              <select
                id="status"
                {...register("status")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              >
                {taskStatusValues.map((s) => (
                  <option key={s} value={s}>{statusLabel[s]}</option>
                ))}
              </select>
            </Field>

            <Field label="Priority" htmlFor="priority">
              <select
                id="priority"
                {...register("priority")}
                className="flex h-11 w-full rounded-md border border-border bg-background px-3 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
                style={{ color: `var(--priority-${watch("priority").toLowerCase()}, var(--foreground))` }}
              >
                {priorityValues.map((p) => (
                  <option key={p} value={p}>{priorityLabel[p]}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Due date" htmlFor="dueDate">
            <Input id="dueDate" type="date" {...register("dueDate")} />
          </Field>

          {/* Tags */}
          <div className="space-y-1.5">
            <Label>Tags</Label>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {tags.map((t) => (
                  <span key={t} className="flex items-center gap-1 rounded-full bg-primary/8 px-2.5 py-1 text-xs text-primary">
                    {t}
                    <button type="button" onClick={() => setValue("tags", tags.filter((x) => x !== t))} className="hover:text-danger">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <Input
              placeholder="Type a tag, press Enter"
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
            />
          </div>

          {/* Subtasks */}
          <div className="space-y-1.5">
            <Label>Subtasks</Label>
            <div className="space-y-2">
              {subtasks.map((s, i) => (
                <div key={s._id ?? i} className="flex items-center gap-2 rounded-md border border-border px-3 py-2">
                  <Checkbox checked={s.done} onCheckedChange={() => toggleSubtask(i)} />
                  <span className={cn("flex-1 text-sm", s.done && "text-muted-foreground line-through")}>{s.title}</span>
                  <button
                    type="button"
                    onClick={() => setValue("subtasks", subtasks.filter((_, idx) => idx !== i))}
                    className="text-muted-foreground hover:text-danger transition-colors"
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
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addSubtask(); } }}
              />
              <Button type="button" variant="outline" size="icon" onClick={addSubtask}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* ── Optional / Advanced section (City) ── */}
          <div className="rounded-lg border border-border/60 bg-background-secondary/40">
            <button
              type="button"
              onClick={() => setCityOpen((o) => !o)}
              className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" />
                Optional — Location &amp; Weather
                {city && <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] text-primary">{city}</span>}
              </span>
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform duration-200", cityOpen && "rotate-180")} />
            </button>

            {cityOpen && (
              <div className="border-t border-border/60 px-4 pb-4 pt-3 space-y-3">
                <p className="text-xs text-muted-foreground">Enter a city to display local weather on this task.</p>
                <Input id="city" placeholder="e.g. San Francisco" {...register("city")} />
                {city && (
                  <div className="pt-1">
                    <WeatherChip city={city} variant="field" />
                  </div>
                )}
              </div>
            )}
          </div>

          {isEdit && editingTaskId && <TaskAttachments taskId={editingTaskId} />}
          {isEdit && editingTaskId && <TaskActivity taskId={editingTaskId} enabled={taskModalOpen} />}
        </div>

        {/* ── Sticky footer ── */}
        <div className="shrink-0 border-t border-border bg-background px-6 py-4">
          <div className="flex items-center justify-between">
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
                    className="bg-danger text-primary-foreground hover:bg-danger/90"
                    onClick={handleDelete}
                    disabled={deleteTask.isPending}
                  >
                    {deleteTask.isPending ? "Deleting…" : "Delete"}
                  </Button>
                </div>
              ) : (
                <Button type="button" variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger-bg" onClick={() => setConfirmingDelete(true)}>
                  Delete task
                </Button>
              )
            ) : (
              <span />
            )}

            <div className="flex items-center gap-2">
              <Button type="button" variant="outline" onClick={closeTaskModal}>
                Cancel
              </Button>
              <Button type="submit" form="task-form" disabled={isSubmitting}>
                {isSubmitting ? "Saving…" : isEdit ? "Save Changes" : "Create Task"}
              </Button>
            </div>
          </div>
        </div>

        {/* Form (separate from the sticky footer buttons — linked via form id) */}
        <form id="task-form" onSubmit={handleSubmit(onSubmit)} className="hidden" noValidate />
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