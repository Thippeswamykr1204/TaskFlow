"use client";

import { useEffect, useState } from "react";
import { X, Plus, SlidersHorizontal } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TaskRow, TaskRowSkeleton } from "@/components/dashboard/task-row";
import { TaskListError } from "@/components/dashboard/empty-state";
import { TaskFormModal } from "@/components/tasks/task-form-modal";
import { useUiStore, type TaskFilters } from "@/lib/store/ui-store";
import { useTasks } from "@/lib/hooks/use-tasks";
import { taskStatusValues, priorityValues } from "@/lib/validation/task-schemas";
import { cn } from "@/lib/utils";

const statusLabel: Record<TaskFilters["status"], string> = {
  ALL: "All statuses",
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityLabel: Record<TaskFilters["priority"], string> = {
  ALL: "All priorities",
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

// ─── Styled select wrapper ────────────────────────────────────────────────────
function StyledSelect({ value, onChange, children, "aria-label": ariaLabel }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  "aria-label"?: string;
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        className="h-10 appearance-none rounded-lg border border-border bg-background pl-3 pr-8 text-sm text-foreground shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary cursor-pointer hover:border-primary/40"
      >
        {children}
      </select>
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
          <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      </span>
    </div>
  );
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
    <div className="max-w-[1100px] animate-fade-up">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold text-foreground">My Tasks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {meta?.total != null ? `${meta.total} task${meta.total !== 1 ? "s" : ""} total` : "Manage your work"}
          </p>
        </div>
        <Button onClick={openCreateTaskModal} className="interactive gap-2">
          <Plus className="h-4 w-4" />
          New Task
        </Button>
      </div>

      {/* Filter bar */}
      <div className="mt-6 rounded-xl border border-border bg-background-secondary/60 px-4 py-3.5">
        <div className="flex flex-wrap items-center gap-3">
          <SlidersHorizontal className="h-4 w-4 text-muted-foreground shrink-0" />

          {/* Search */}
          <div className="min-w-[200px] flex-1">
            <Input
              placeholder="Search tasks…"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
              className="h-10 rounded-lg bg-background"
            />
          </div>

          {/* Status */}
          <StyledSelect
            aria-label="Filter by status"
            value={filters.status}
            onChange={(v) => setTaskFilter("status", v as TaskFilters["status"])}
          >
            <option value="ALL">All statuses</option>
            {taskStatusValues.map((s) => (
              <option key={s} value={s}>{statusLabel[s]}</option>
            ))}
          </StyledSelect>

          {/* Priority */}
          <StyledSelect
            aria-label="Filter by priority"
            value={filters.priority}
            onChange={(v) => setTaskFilter("priority", v as TaskFilters["priority"])}
          >
            <option value="ALL">All priorities</option>
            {priorityValues.map((p) => (
              <option key={p} value={p}>{priorityLabel[p]}</option>
            ))}
          </StyledSelect>

          {/* Date range */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={filters.startDate}
              onChange={(e) => setTaskFilter("startDate", e.target.value)}
              aria-label="Due from"
              className="h-10 w-36 rounded-lg text-sm"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <Input
              type="date"
              value={filters.endDate}
              onChange={(e) => setTaskFilter("endDate", e.target.value)}
              aria-label="Due to"
              className="h-10 w-36 rounded-lg text-sm"
            />
          </div>

          {/* Sort */}
          <StyledSelect
            aria-label="Sort tasks"
            value={`${filters.sortBy}:${filters.sortOrder}`}
            onChange={(v) => {
              const [sortBy, sortOrder] = v.split(":") as [TaskFilters["sortBy"], TaskFilters["sortOrder"]];
              setTaskFilter("sortBy", sortBy);
              setTaskFilter("sortOrder", sortOrder);
            }}
          >
            <option value="dueDate:asc">Due date ↑</option>
            <option value="dueDate:desc">Due date ↓</option>
            <option value="priority:asc">Priority ↑</option>
            <option value="priority:desc">Priority ↓</option>
            <option value="createdAt:asc">Created ↑</option>
            <option value="createdAt:desc">Created ↓</option>
          </StyledSelect>
        </div>
      </div>

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">Filters:</span>
          {filters.search && (
            <FilterChip label={`"${filters.search}"`} onClear={() => { setSearchDraft(""); clearTaskFilter("search"); }} />
          )}
          {filters.status !== "ALL" && (
            <FilterChip label={statusLabel[filters.status]} onClear={() => clearTaskFilter("status")} />
          )}
          {filters.priority !== "ALL" && (
            <FilterChip label={priorityLabel[filters.priority]} onClear={() => clearTaskFilter("priority")} />
          )}
          {filters.startDate && (
            <FilterChip label={`From ${filters.startDate}`} onClear={() => clearTaskFilter("startDate")} />
          )}
          {filters.endDate && (
            <FilterChip label={`To ${filters.endDate}`} onClear={() => clearTaskFilter("endDate")} />
          )}
          <button
            onClick={clearAllTaskFilters}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Task list */}
      <div className="card-surface mt-5 px-5">
        {query.isLoading && Array.from({ length: 6 }).map((_, i) => <TaskRowSkeleton key={i} />)}
        {query.isError && <TaskListError onRetry={() => query.refetch()} />}

        {noTasksAtAll && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
              <Plus className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-heading text-base font-semibold text-foreground">No tasks yet</p>
              <p className="mt-1 text-sm text-muted-foreground">Create your first task to get started.</p>
            </div>
            <Button size="sm" onClick={openCreateTaskModal}>Create first task</Button>
          </div>
        )}

        {noTasksMatchFilters && (
          <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-background-secondary">
              <SlidersHorizontal className="h-7 w-7 text-muted-foreground" />
            </div>
            <div>
              <p className="font-heading text-base font-semibold text-foreground">No tasks match</p>
              <p className="mt-1 text-sm text-muted-foreground">Try adjusting or clearing your filters.</p>
            </div>
            <Button size="sm" variant="outline" onClick={clearAllTaskFilters}>Clear all filters</Button>
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
                  transition={{ duration: 0.18, ease: "easeOut" }}
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

      {/* Pagination */}
      {meta && meta.lastPage > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setTaskPage(page - 1)}>
            ← Prev
          </Button>
          <span className="rounded-md bg-background-secondary px-3 py-1.5 text-sm text-muted-foreground">
            {meta.page} / {meta.lastPage}
          </span>
          <Button variant="outline" size="sm" disabled={page >= meta.lastPage} onClick={() => setTaskPage(page + 1)}>
            Next →
          </Button>
        </div>
      )}

      <TaskFormModal />
    </div>
  );
}

function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <span className={cn(
      "interactive flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs font-medium text-foreground",
      "hover:border-primary/30 hover:bg-primary/5 hover:text-primary transition-colors",
    )}>
      {label}
      <button onClick={onClear} aria-label={`Clear ${label}`} className="ml-0.5 hover:text-danger transition-colors">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}