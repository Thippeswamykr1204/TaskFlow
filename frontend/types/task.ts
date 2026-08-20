export type TaskStatus = "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskLocation {
  city: string;
  lat?: number;
  lng?: number;
}

export interface Subtask {
  _id: string;
  title: string;
  done: boolean;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: Priority;
  dueDate?: string;
  completedAt?: string;
  location?: TaskLocation;
  tags: string[];
  subtasks: Subtask[];
  archived: boolean;
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

// Subtask input has no _id — server assigns it on create.
export interface SubtaskInput {
  title: string;
  done?: boolean;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string;
  location?: TaskLocation;
  tags?: string[];
  subtasks?: SubtaskInput[];
}

export type UpdateTaskInput = Partial<CreateTaskInput>;