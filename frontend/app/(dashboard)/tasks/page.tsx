"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskRow, TaskRowSkeleton } from "@/components/dashboard/task-row";
import { TaskListError } from "@/components/dashboard/empty-state";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { useUiStore, type TaskFilters } from "@/lib/store/ui-store";
import { useTasks } from "@/lib/hooks/use-tasks";
import { taskStatusValues, priorityValues } from "@/lib/validation/task-schemas";

const statusLabel: Record<TaskFilters["status"], string> = {
  ALL: "All",
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityLabel: Record<TaskFilters["priority"], string> = {
  ALL: "All",
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

function useDebounced<T>(value: T, delayMs: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}

export default function TasksPage() {
  const filters = useUiStore((s) => s.taskFilters);
  const setTaskFilter = useUiStore((s) => s.setTaskFilter);
  const clearTaskFilter = useUiStore((s) => s.clearTaskFilter);
  const clearAllTaskFilters = useUiStore((s) => s.clearAllTaskFilters);
  const page = useUiStore((s) => s.taskPage);
  const setTaskPage = useUiStore((s) => s.setTaskPage);
  const openCreateTaskModal = useUiStore((s) => s.openCreateTaskModal);
  const openEditTaskModal = useUiStore((s) => s.openEditTaskModal);

  const [searchDraft, setSearchDraft] = useState(filters.search);
  const debouncedSearch = useDebounced(searchDraft, 300);

  useEffect(() => {
    if (debouncedSearch !== filters.search) {
      setTaskFilter("search", debouncedSearch);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const query = useTasks({
    page,
    limit: 20,
    status: filters.status === "ALL" ? undefined : filters.status,
    priority: filters.priority === "ALL" ? undefined : filters.priority,
    search: filters.search || undefined,
    startDate: filters.startDate || undefined,
    endDate: filters.endDate || undefined,
    sortBy: filters.sortBy,
    sortOrder: filters.sortOrder,
  });

  const hasActiveFilters =
    filters.search || filters.status !== "ALL" || filters.priority !== "ALL" || filters.startDate || filters.endDate;

  const tasks = query.data?.data ?? [];
  const meta = query.data?.meta;
  const noTasksAtAll = query.isSuccess && tasks.length === 0 && !hasActiveFilters && meta?.total === 0;
  const noTasksMatchFilters = query.isSuccess && tasks.length === 0 && hasActiveFilters;

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-2xl font-bold text-foreground">My Tasks</h1>
        <Button onClick={openCreateTaskModal}>New Task</Button>
      </div>

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="min-w-[220px] flex-1 space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Search</label>
          <Input
            placeholder="Search tasks…"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setTaskFilter("status", e.target.value as TaskFilters["status"])}
            className="flex h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="ALL">All</option>
            {taskStatusValues.map((s) => (
              <option key={s} value={s}>
                {statusLabel[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => setTaskFilter("priority", e.target.value as TaskFilters["priority"])}
            className="flex h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="ALL">All</option>
            {priorityValues.map((p) => (
              <option key={p} value={p}>
                {priorityLabel[p]}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Due from</label>
          <Input type="date" value={filters.startDate} onChange={(e) => setTaskFilter("startDate", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Due to</label>
          <Input type="date" value={filters.endDate} onChange={(e) => setTaskFilter("endDate", e.target.value)} />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">Sort by</label>
          <select
            value={`${filters.sortBy}:${filters.sortOrder}`}
            onChange={(e) => {
              const [sortBy, sortOrder] = e.target.value.split(":") as [TaskFilters["sortBy"], TaskFilters["sortOrder"]];
              setTaskFilter("sortBy", sortBy);
              setTaskFilter("sortOrder", sortOrder);
            }}
            className="flex h-11 rounded-md border border-border bg-background px-3 text-sm text-foreground"
          >
            <option value="dueDate:asc">Due date ↑</option>
            <option value="dueDate:desc">Due date ↓</option>
            <option value="priority:asc">Priority ↑</option>
            <option value="priority:desc">Priority ↓</option>
            <option value="createdAt:asc">Created ↑</option>
            <option value="createdAt:desc">Created ↓</option>
          </select>
        </div>
      </div>

      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap gap-2">
          {filters.search && (
            <FilterChip label={`Search: ${filters.search}`} onClear={() => { setSearchDraft(""); clearTaskFilter("search"); }} />
          )}
          {filters.status !== "ALL" && (
            <FilterChip label={`Status: ${statusLabel[filters.status]}`} onClear={() => clearTaskFilter("status")} />
          )}
          {filters.priority !== "ALL" && (
            <FilterChip label={`Priority: ${priorityLabel[filters.priority]}`} onClear={() => clearTaskFilter("priority")} />
          )}
          {filters.startDate && (
            <FilterChip label={`From: ${filters.startDate}`} onClear={() => clearTaskFilter("startDate")} />
          )}
          {filters.endDate && (
            <FilterChip label={`To: ${filters.endDate}`} onClear={() => clearTaskFilter("endDate")} />
          )}
        </div>
      )}

      <div className="card-surface mt-6 px-5">
        {query.isLoading && Array.from({ length: 6 }).map((_, i) => <TaskRowSkeleton key={i} />)}

        {query.isError && <TaskListError onRetry={() => query.refetch()} />}

        {noTasksAtAll && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <p className="text-sm text-muted-foreground">No tasks yet. Create your first one to get started.</p>
            <Button size="sm" onClick={openCreateTaskModal}>New Task</Button>
          </div>
        )}

        {noTasksMatchFilters && (
          <div className="flex flex-col items-center justify-center gap-3 py-14 text-center">
            <p className="text-sm text-muted-foreground">No tasks match your filters.</p>
            <Button size="sm" variant="outline" onClick={clearAllTaskFilters}>Clear filters</Button>
          </div>
        )}

        {tasks.length > 0 && (
          <div>
            <AnimatePresence initial={false}>
              {tasks.map((task) => (
                <motion.div
                  key={task._id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  onClick={() => openEditTaskModal(task._id)}
                  className="cursor-pointer"
                >
                  <TaskRow task={task} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {meta && meta.lastPage > 1 && (
        <div className="mt-4 flex items-center justify-center gap-4">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setTaskPage(page - 1)}>
            Prev
          </Button>
          <span className="text-sm text-muted-foreground">
            Page {meta.page} of {meta.lastPage}
          </span>
          <Button variant="outline" size="sm" disabled={page >= meta.lastPage} onClick={() => setTaskPage(page + 1)}>
            Next
          </Button>
        </div>
      )}

      <TaskFormModal />
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-border bg-background-secondary px-3 py-1 text-xs text-foreground">
      {label}
      <button onClick={onClear} aria-label={`Clear ${label}`}>
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}