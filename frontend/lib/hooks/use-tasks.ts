"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  type TaskListParams,
  type TaskListResult,
} from "@/lib/api/tasks";
import type { Task, CreateTaskInput, UpdateTaskInput } from "@/types/task";

export function useTasks(filters: TaskListParams) {
  return useQuery({
    queryKey: ["tasks", "list", filters],
    queryFn: () => fetchTasks(filters),
    placeholderData: (prev) => prev, // keepPreviousData replacement, TanStack Query v5
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTask(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: UpdateTaskInput }) => updateTask(id, input),
    onMutate: async ({ id, input }) => {
      await qc.cancelQueries({ queryKey: ["tasks"] });

      // Snapshot every "tasks","list",* query currently cached, so we can roll back all of them.
      const previousLists = qc.getQueriesData<TaskListResult>({ queryKey: ["tasks", "list"] });

      previousLists.forEach(([key, data]) => {
        if (!data) return;
        qc.setQueryData<TaskListResult>(key, {
          ...data,
          data: data.data.map((t) => (t._id === id ? patchTask(t, input) : t)),
        });
      });

      return { previousLists };
    },
    onError: (_err, _vars, context) => {
      context?.previousLists?.forEach(([key, data]) => {
        qc.setQueryData(key, data);
      });
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTask(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

// Shallow-merge optimistic patch onto a cached task (handles nested subtasks toggle too).
function patchTask(task: Task, input: UpdateTaskInput): Task {
  return {
    ...task,
    ...input,
    subtasks: input.subtasks
      ? input.subtasks.map((s, i) => ({ _id: task.subtasks[i]?._id ?? String(i), title: s.title, done: !!s.done }))
      : task.subtasks,
  } as Task;
}