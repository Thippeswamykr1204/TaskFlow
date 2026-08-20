"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { TaskListError } from "@/components/dashboard/empty-state";
import { useTaskStats } from "@/lib/hooks/use-dashboard-data";
import type { TaskStatus, Priority } from "@/types/task";

// Reuses the app's existing status/priority CSS custom properties (see
// globals.css) rather than inventing a new palette. BACKLOG and DONE don't
// have dedicated status-* tokens of their own (TaskRow reuses todo/in-progress
// styling for them), so they're mapped to the closest distinct token here to
// keep all four breakdown slices visually distinguishable.
const statusColor: Record<TaskStatus, string> = {
  BACKLOG: "var(--status-todo-fg)",
  TODO: "var(--status-pending-fg)",
  IN_PROGRESS: "var(--status-in-progress-fg)",
  DONE: "var(--secondary-accent)",
};

const statusLabel: Record<TaskStatus, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityColor: Record<Priority, string> = {
  LOW: "var(--priority-low)",
  MEDIUM: "var(--priority-medium)",
  HIGH: "var(--priority-high)",
  URGENT: "var(--danger)",
};

const priorityLabel: Record<Priority, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

export default function AnalyticsPage() {
  const stats = useTaskStats();

  const statusData = stats.data
    ? (Object.keys(stats.data.byStatus) as TaskStatus[]).map((status) => ({
        status,
        label: statusLabel[status],
        count: stats.data!.byStatus[status],
      }))
    : [];

  const priorityData = stats.data
    ? (Object.keys(stats.data.byPriority) as Priority[]).map((priority) => ({
        priority,
        label: priorityLabel[priority],
        count: stats.data!.byPriority[priority],
      }))
    : [];

  const completionPercent = stats.data ? Math.round(stats.data.completionRate * 100) : 0;
  const gaugeData = [{ name: "Completion", value: completionPercent, fill: "var(--secondary-accent)" }];

  return (
    <div>
      <h1 className="font-heading text-3xl font-bold text-foreground">Analytics</h1>
      <p className="mt-1 text-muted-foreground">A snapshot of where your tasks stand right now.</p>

      {stats.isLoading && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}

      {stats.isError && (
        <div className="mt-8">
          <TaskListError onRetry={() => stats.refetch()} />
        </div>
      )}

      {stats.data && stats.data.total === 0 && (
        <div className="card-surface mt-8 flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            No tasks yet — create a few to see your analytics here.
          </p>
        </div>
      )}

      {stats.data && stats.data.total > 0 && (
        <>
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard icon={AlertTriangle} label="Overdue" value={String(stats.data.overdue)} tone="danger" />
            <StatCard
              icon={CheckCircle2}
              label="Completed This Week"
              value={String(stats.data.completedThisWeek)}
              tone="teal"
            />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <p className="text-sm font-medium text-foreground">Status Breakdown</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={statusData}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                    <Tooltip />
                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                      {statusData.map((entry) => (
                        <Cell key={entry.status} fill={statusColor[entry.status]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <p className="text-sm font-medium text-foreground">Priority Breakdown</p>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      dataKey="count"
                      nameKey="label"
                      innerRadius={45}
                      outerRadius={75}
                      paddingAngle={2}
                    >
                      {priorityData.map((entry) => (
                        <Cell key={entry.priority} fill={priorityColor[entry.priority]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 flex flex-wrap justify-center gap-3">
                  {priorityData.map((entry) => (
                    <span key={entry.priority} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: priorityColor[entry.priority] }}
                      />
                      {entry.label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <p className="text-sm font-medium text-foreground">Completion Rate</p>
              </CardHeader>
              <CardContent className="flex flex-col items-center">
                <div className="relative w-full">
                  <ResponsiveContainer width="100%" height={220}>
                    <RadialBarChart
                      data={gaugeData}
                      innerRadius="70%"
                      outerRadius="100%"
                      startAngle={90}
                      endAngle={-270}
                    >
                      <RadialBar dataKey="value" background cornerRadius={8} max={100} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                    <p className="font-heading text-3xl font-bold text-foreground">{completionPercent}%</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/*
            No trend-over-time chart here on purpose: GET /tasks/stats returns
            a single point-in-time snapshot, not a historical series, so a
            "trend" line would have to be fabricated. Worth adding a real
            time-series stats endpoint on the backend in a future tier if
            trend charts are wanted.
          */}
        </>
      )}
    </div>
  );
}