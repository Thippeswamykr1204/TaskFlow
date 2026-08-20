import { create } from "zustand";
import type { TaskStatus, Priority } from "@/types/task";

export interface TaskFilters {
  search: string;
  status: TaskStatus | "ALL";
  priority: Priority | "ALL";
  startDate: string;
  endDate: string;
  sortBy: "dueDate" | "priority" | "createdAt";
  sortOrder: "asc" | "desc";
}

const defaultFilters: TaskFilters = {
  search: "",
  status: "ALL",
  priority: "ALL",
  startDate: "",
  endDate: "",
  sortBy: "createdAt",
  sortOrder: "desc",
};

interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;

  // Task view state (UI only — task data itself lives in TanStack Query).
  taskFilters: TaskFilters;
  setTaskFilter: <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) => void;
  clearTaskFilter: (key: keyof TaskFilters) => void;
  clearAllTaskFilters: () => void;

  taskPage: number;
  setTaskPage: (page: number) => void;

  taskModalOpen: boolean;
  editingTaskId: string | null;
  openCreateTaskModal: () => void;
  openEditTaskModal: (taskId: string) => void;
  closeTaskModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),

  taskFilters: defaultFilters,
  setTaskFilter: (key, value) =>
    set((s) => ({ taskFilters: { ...s.taskFilters, [key]: value }, taskPage: 1 })),
  clearTaskFilter: (key) =>
    set((s) => ({ taskFilters: { ...s.taskFilters, [key]: defaultFilters[key] }, taskPage: 1 })),
  clearAllTaskFilters: () => set({ taskFilters: defaultFilters, taskPage: 1 }),

  taskPage: 1,
  setTaskPage: (page) => set({ taskPage: page }),

  taskModalOpen: false,
  editingTaskId: null,
  openCreateTaskModal: () => set({ taskModalOpen: true, editingTaskId: null }),
  openEditTaskModal: (taskId) => set({ taskModalOpen: true, editingTaskId: taskId }),
  closeTaskModal: () => set({ taskModalOpen: false, editingTaskId: null }),
}));