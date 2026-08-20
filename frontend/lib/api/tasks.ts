import { api } from "@/lib/api";
import type { Task, TaskStats } from "@/types/task";

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