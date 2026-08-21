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
  type TooltipProps,
} from "recharts";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { StatCard, StatCardSkeleton } from "@/components/dashboard/stat-card";
import { TaskListError } from "@/components/dashboard/empty-state";
import { useTaskStats } from "@/lib/hooks/use-dashboard-data";
import type { TaskStatus, Priority } from "@/types/task";

// ─── Color maps (reuse existing CSS tokens) ───────────────────────────────────
const statusColor: Record<TaskStatus, string> = {
  BACKLOG: "var(--status-backlog-fg)",
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

// ─── Custom recharts tooltip ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;
  return (
    <div className="card-surface rounded-lg px-3 py-2 text-sm">
      {label && <p className="mb-1 font-medium text-foreground">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} className="text-muted-foreground">
          <span className="font-heading font-semibold text-foreground">{p.value}</span>{" "}
          {p.name ?? "tasks"}
        </p>
      ))}
    </div>
  );
}

// ─── Section card ─────────────────────────────────────────────────────────────
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="interactive overflow-hidden">
      <CardHeader className="pb-1">
        <p className="font-heading text-base font-semibold text-foreground">{title}</p>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

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
    <div className="max-w-[1100px] animate-fade-up">
      <h1 className="font-heading text-3xl font-bold text-foreground">Analytics</h1>
      <p className="mt-1 text-sm text-muted-foreground">A snapshot of where your tasks stand right now.</p>

      {stats.isLoading && (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 2 }).map((_, i) => <StatCardSkeleton key={i} />)}
        </div>
      )}

      {stats.isError && (
        <div className="mt-8">
          <TaskListError onRetry={() => stats.refetch()} />
        </div>
      )}

      {stats.data && stats.data.total === 0 && (
        <div className="card-surface mt-8 flex flex-col items-center justify-center gap-3 px-5 py-14 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/8">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <p className="font-heading text-base font-semibold text-foreground">No data yet</p>
          <p className="text-sm text-muted-foreground">Create some tasks to see your analytics here.</p>
        </div>
      )}

      {stats.data && stats.data.total > 0 && (
        <>
          {/* Summary stat cards */}
          <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <StatCard
              icon={AlertTriangle}
              label="Overdue"
              value={String(stats.data.overdue)}
              tone="danger"
              trend={stats.data.overdue > 0 ? { direction: "down", pct: Math.round((stats.data.overdue / stats.data.total) * 100) } : null}
            />
            <StatCard
              icon={CheckCircle2}
              label="Completed This Week"
              value={String(stats.data.completedThisWeek)}
              tone="teal"
              trend={{ direction: "up", pct: Math.round(stats.data.completionRate * 100) }}
            />
          </div>

          {/* Charts grid */}
          <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
            <ChartCard title="Status Breakdown">
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusData} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
                  <XAxis dataKey="label" tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "var(--muted-foreground)" }} />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--background-secondary)" }} />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {statusData.map((entry) => (
                      <Cell key={entry.status} fill={statusColor[entry.status]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Priority Breakdown">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={priorityData}
                    dataKey="count"
                    nameKey="label"
                    innerRadius={48}
                    outerRadius={80}
                    paddingAngle={3}
                    strokeWidth={0}
                  >
                    {priorityData.map((entry) => (
                      <Cell key={entry.priority} fill={priorityColor[entry.priority]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-1 flex flex-wrap justify-center gap-3">
                {priorityData.map((entry) => (
                  <span key={entry.priority} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: priorityColor[entry.priority] }} />
                    {entry.label} <span className="font-medium text-foreground">{entry.count}</span>
                  </span>
                ))}
              </div>
            </ChartCard>

            <ChartCard title="Completion Rate">
              <div className="relative">
                <ResponsiveContainer width="100%" height={220}>
                  <RadialBarChart
                    data={gaugeData}
                    innerRadius="70%"
                    outerRadius="100%"
                    startAngle={90}
                    endAngle={-270}
                  >
                    <RadialBar dataKey="value" background={{ fill: "var(--border)" }} cornerRadius={10} max={100} />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="font-heading text-3xl font-bold text-foreground">{completionPercent}%</p>
                  <p className="text-xs text-muted-foreground">of tasks done</p>
                </div>
              </div>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  );
}