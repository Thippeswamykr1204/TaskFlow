"use client";

import Link from "next/link";
import { ClipboardList, PlayCircle, AlertTriangle, PieChart, ArrowRight } from "lucide-react";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { TaskRow, TaskRowSkeleton } from "@/components/dashboard/task-row";
import { TaskListEmpty, TaskListError } from "@/components/dashboard/empty-state";
import { useTaskStats, useTodayTasks } from "@/lib/hooks/use-dashboard-data";
import { useAuthStore } from "@/lib/store/auth-store";

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

  // "Active" = tasks currently in flight — TODO + IN_PROGRESS (excludes backlog/done).
  const active = stats.data ? stats.data.byStatus.TODO + stats.data.byStatus.IN_PROGRESS : 0;

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold capitalize text-foreground">
        Good {greeting()}, {user?.name?.split(" ")[0]}
      </h1>
      <p className="mt-1 text-muted-foreground">Let&apos;s keep the momentum going.</p>

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.isLoading &&
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}

        {stats.isError && (
          <div className="col-span-full">
            <TaskListError onRetry={() => stats.refetch()} />
          </div>
        )}

        {stats.data && (
          <>
            <StatCard icon={ClipboardList} label="Total Tasks" value={String(stats.data.total)} />
            <StatCard icon={PlayCircle} label="Active" value={String(active)} tone="teal" />
            <StatCard icon={AlertTriangle} label="Overdue" value={String(stats.data.overdue)} tone="danger" />
            <StatCard
              icon={PieChart}
              label="Completion Rate"
              value={`${Math.round(stats.data.completionRate * 100)}%`}
              tone="teal"
            />
          </>
        )}
      </div>

      <div className="mt-10">
        <div className="mb-2 flex items-center justify-between">
          <div>
            <h2 className="font-heading text-xl font-semibold text-foreground">Today&apos;s Focus</h2>
            <p className="text-sm text-muted-foreground">Tasks scheduled for today</p>
          </div>
          <Link href="/tasks" className="flex items-center gap-1 text-sm font-medium text-primary hover:underline">
            View all tasks <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <div className="card-surface px-5">
          {today.isLoading &&
            Array.from({ length: 4 }).map((_, i) => <TaskRowSkeleton key={i} />)}

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
    </div>
  );
}