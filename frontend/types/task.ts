export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  completedAt?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<Priority, number>;
  overdue: number;
  completedThisWeek: number;
  completionRate: number; // 0–1
}