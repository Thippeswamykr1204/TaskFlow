import { api } from "@/lib/api";
import type { Task, TaskStats, CreateTaskInput, UpdateTaskInput } from "@/types/task";

export async function fetchTaskStats() {
  const res = await api.get<{ success: boolean; data: TaskStats }>("/tasks/stats");
  return res.data.data;
}

// "Today's Focus": tasks due today, soonest first, not yet done.
export async function fetchTodayTasks() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const res = await api.get<{
    success: boolean;
    data: Task[];
    meta: { total: number; page: number; lastPage: number };
  }>("/tasks", {
    params: {
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      sortBy: "dueDate",
      sortOrder: "asc",
      limit: 20,
    },
  });
  return res.data.data;
}

export interface TaskListParams {
  page?: number;
  limit?: number;
  status?: Task["status"];
  priority?: Task["priority"];
  search?: string;
  tags?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface TaskListResult {
  data: Task[];
  meta: { total: number; page: number; lastPage: number };
}

export async function fetchTasks(params: TaskListParams): Promise<TaskListResult> {
  const res = await api.get<{
    success: boolean;
    data: Task[];
    meta: { total: number; page: number; lastPage: number };
  }>("/tasks", { params });
  return { data: res.data.data, meta: res.data.meta };
}

export async function createTask(input: CreateTaskInput) {
  const res = await api.post<{ success: boolean; data: Task }>("/tasks", input);
  return res.data.data;
}

export async function updateTask(id: string, input: UpdateTaskInput) {
  const res = await api.patch<{ success: boolean; data: Task }>(`/tasks/${id}`, input);
  return res.data.data;
}

export async function deleteTask(id: string) {
  await api.delete(`/tasks/${id}`);
}