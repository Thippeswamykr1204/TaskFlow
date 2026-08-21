"use client";

import Link from "next/link";
import { ClipboardList, PlayCircle, AlertTriangle, PieChart, ArrowRight, Plus, Kanban, Clock } from "lucide-react";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { TaskRow, TaskRowSkeleton, relativeDate } from "@/components/dashboard/task-row";
import { TaskListEmpty, TaskListError } from "@/components/dashboard/empty-state";
import { useTaskStats, useTodayTasks } from "@/lib/hooks/use-dashboard-data";
import { useAuthStore } from "@/lib/store/auth-store";
import { useUiStore } from "@/lib/store/ui-store";
import { useAllTasks } from "@/lib/hooks/use-tasks";
import { cn } from "@/lib/utils";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "morning";
  if (hour < 18) return "afternoon";
  return "evening";
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const stats = useTaskStats();
  const today = useTodayTasks();
  const allTasks = useAllTasks();
  const openCreateTaskModal = useUiStore((s) => s.openCreateTaskModal);

  const active = stats.data ? stats.data.byStatus.TODO + stats.data.byStatus.IN_PROGRESS : 0;
  const completionPct = stats.data ? Math.round(stats.data.completionRate * 100) : 0;

  // Derive simple trend signals from current data
  const overdueCount = stats.data?.overdue ?? 0;
  const totalCount = stats.data?.total ?? 0;

  // Recent activity: last 5 tasks from all tasks, sorted by most recently created
  const recentTasks = allTasks.data
    ? [...allTasks.data]
        .sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
        .slice(0, 5)
    : [];

  return (
    <div className="animate-fade-up max-w-[1400px]">
      {/* ── Greeting ── */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-4xl font-bold capitalize text-foreground">
            Good {greeting()}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p className="mt-1.5 text-muted-foreground">Here&apos;s where things stand today.</p>
        </div>
        {/* Quick actions */}
        <div className="flex shrink-0 items-center gap-2 pt-1">
          <button
            onClick={openCreateTaskModal}
            className="interactive flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Plus className="h-4 w-4" />
            New Task
          </button>
          <Link
            href="/kanban"
            className="interactive flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
          >
            <Kanban className="h-4 w-4" />
            Kanban
          </Link>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.isLoading && Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}

        {stats.isError && (
          <div className="col-span-full">
            <TaskListError onRetry={() => stats.refetch()} />
          </div>
        )}

        {stats.data && (
          <>
            <StatCard
              icon={ClipboardList}
              label="Total Tasks"
              value={String(stats.data.total)}
              trend={totalCount > 0 ? { direction: "up", pct: completionPct } : null}
            />
            <StatCard
              icon={PlayCircle}
              label="Active"
              value={String(active)}
              tone="teal"
              trend={active > 0 ? { direction: "up", pct: Math.round((active / Math.max(totalCount, 1)) * 100) } : null}
            />
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={String(overdueCount)}
              tone="danger"
              trend={overdueCount > 0 ? { direction: "down", pct: Math.round((overdueCount / Math.max(totalCount, 1)) * 100) } : null}
            />
            <StatCard
              icon={PieChart}
              label="Completion Rate"
              value={`${completionPct}%`}
              tone="teal"
              trend={completionPct > 50 ? { direction: "up", pct: completionPct } : { direction: "down", pct: completionPct }}
            />
          </>
        )}
      </div>

      {/* ── Main content: 2-col on lg ── */}
      <div className="mt-10 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Today's Focus (2/3) */}
        <div className="lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-heading text-xl font-semibold text-foreground">Today&apos;s Focus</h2>
              <p className="text-sm text-muted-foreground">Tasks scheduled for today</p>
            </div>
            <Link href="/tasks" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
              View all <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="card-surface px-5">
            {today.isLoading && Array.from({ length: 4 }).map((_, i) => <TaskRowSkeleton key={i} />)}
            {today.isError && <TaskListError onRetry={() => today.refetch()} />}
            {today.data && today.data.length === 0 && <TaskListEmpty />}
            {today.data && today.data.length > 0 && (
              <div>
                {today.data.map((task) => (
                  <TaskRow key={task._id} task={task} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity (1/3) */}
        <div className="lg:col-span-1">
          <div className="mb-3">
            <h2 className="font-heading text-xl font-semibold text-foreground">Recent Activity</h2>
            <p className="text-sm text-muted-foreground">Last updated tasks</p>
          </div>

          <div className="card-surface divide-y divide-border">
            {allTasks.isLoading && (
              <div className="space-y-3 p-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 h-7 w-7 animate-pulse rounded-full bg-border" />
                    <div className="flex-1 space-y-1.5">
                      <span className="block h-3 w-32 animate-pulse rounded bg-border" />
                      <span className="block h-3 w-20 animate-pulse rounded bg-border" />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {recentTasks.length === 0 && !allTasks.isLoading && (
              <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
                <ClipboardList className="h-8 w-8 text-border" />
                <p className="text-sm text-muted-foreground">No recent activity yet</p>
              </div>
            )}

            {recentTasks.map((task) => {
              const due = task.dueDate ? relativeDate(task.dueDate) : null;
              const statusDot: Record<string, string> = {
                DONE: "bg-status-done-fg",
                IN_PROGRESS: "bg-status-in-progress-fg",
                TODO: "bg-muted-foreground",
                BACKLOG: "bg-status-backlog-fg",
              };
              return (
                <div key={task._id} className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-background-secondary/50">
                  <span className={cn("mt-1 h-2.5 w-2.5 shrink-0 rounded-full", statusDot[task.status] ?? "bg-border")} />
                  <div className="min-w-0 flex-1">
                    <p className={cn("truncate text-sm font-medium", task.status === "DONE" ? "text-muted-foreground line-through" : "text-foreground")}>
                      {task.title}
                    </p>
                    {due && (
                      <span className={cn("flex items-center gap-1 text-xs mt-0.5", {
                        "text-danger": due.tone === "danger",
                        "text-warning": due.tone === "warning",
                        "text-muted-foreground": due.tone === "muted",
                      })}>
                        <Clock className="h-3 w-3 shrink-0" />
                        {due.label}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}