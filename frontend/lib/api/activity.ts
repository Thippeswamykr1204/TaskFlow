import { api } from "@/lib/api";

export type ActivityAction =
  | "created"
  | "status_changed"
  | "priority_changed"
  | "due_date_changed"
  | "attachment_added"
  | "attachment_removed"
  | "updated";

export interface ActivityEntry {
  _id: string;
  task: string;
  action: ActivityAction;
  meta: Record<string, unknown>;
  createdAt: string;
}

export interface ActivityListResult {
  data: ActivityEntry[];
  meta: { total: number; page: number; lastPage: number };
}

export async function fetchTaskActivity(taskId: string, page = 1): Promise<ActivityListResult> {
  const res = await api.get<{
    success: boolean;
    data: ActivityEntry[];
    meta: { total: number; page: number; lastPage: number };
  }>(`/tasks/${taskId}/activity`, { params: { page } });
  return { data: res.data.data, meta: res.data.meta };
}