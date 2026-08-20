"use client";

import { History } from "lucide-react";
import { useTaskActivity } from "@/lib/hooks/use-activity";
import type { ActivityEntry } from "@/lib/api/activity";

const statusLabel: Record<string, string> = {
  BACKLOG: "Backlog",
  TODO: "To Do",
  IN_PROGRESS: "In Progress",
  DONE: "Done",
};

const priorityLabel: Record<string, string> = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
  URGENT: "Urgent",
};

// Small local formatter — no need to pull in a dependency for this.
function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.round(diffMs / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.round(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;
  const diffMonth = Math.round(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth}mo ago`;
  const diffYear = Math.round(diffMonth / 12);
  return `${diffYear}y ago`;
}

function describeActivity(entry: ActivityEntry): string {
  const meta = entry.meta ?? {};
  switch (entry.action) {
    case "created":
      return "Task created";
    case "status_changed": {
      const from = statusLabel[meta.from as string] ?? String(meta.from ?? "");
      const to = statusLabel[meta.to as string] ?? String(meta.to ?? "");
      return `Status changed from ${from} to ${to}`;
    }
    case "priority_changed": {
      const from = priorityLabel[meta.from as string] ?? String(meta.from ?? "");
      const to = priorityLabel[meta.to as string] ?? String(meta.to ?? "");
      return `Priority changed from ${from} to ${to}`;
    }
    case "due_date_changed": {
      const to = meta.to ? new Date(meta.to as string).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "none";
      return meta.from ? `Due date changed to ${to}` : `Due date set to ${to}`;
    }
    case "attachment_added":
      return `Added ${meta.fileName ?? "an attachment"}`;
    case "attachment_removed":
      return `Removed ${meta.fileName ?? "an attachment"}`;
    case "updated":
    default:
      return "Task updated";
  }
}

export function TaskActivity({ taskId, enabled }: { taskId: string; enabled: boolean }) {
  const activity = useTaskActivity(taskId, enabled);

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">Activity</p>

      {activity.isLoading && (
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-8 animate-pulse rounded-md bg-border" />
          ))}
        </div>
      )}

      {activity.isError && <p className="text-xs text-danger">Couldn&apos;t load activity.</p>}

      {activity.data && activity.data.data.length === 0 && (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border px-3 py-4 text-center">
          <History className="h-4 w-4 shrink-0 text-muted-foreground" />
          <p className="text-xs text-muted-foreground">No activity yet.</p>
        </div>
      )}

      {activity.data && activity.data.data.length > 0 && (
        <ul className="space-y-2">
          {activity.data.data.map((entry) => (
            <li key={entry._id} className="flex items-start justify-between gap-3 text-sm">
              <span className="text-foreground">{describeActivity(entry)}</span>
              <span className="shrink-0 whitespace-nowrap text-xs text-muted-foreground">
                {relativeTime(entry.createdAt)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}