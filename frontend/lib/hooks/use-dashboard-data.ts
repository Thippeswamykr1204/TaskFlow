"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTodayTasks } from "@/lib/api/tasks";
import { useAllTasks } from "@/lib/hooks/use-tasks";
import { useMemo } from "react";
import type { TaskStats } from "@/types/task";

export function useTaskStats() {
  const allTasks = useAllTasks();

  const stats = useMemo(() => {
    if (!allTasks.data) return undefined;
    const data = allTasks.data;
    const total = data.length;
    const byStatus = { BACKLOG: 0, TODO: 0, IN_PROGRESS: 0, DONE: 0 };
    const byPriority = { LOW: 0, MEDIUM: 0, HIGH: 0, URGENT: 0 };
    let overdue = 0;
    let completedThisWeek = 0;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    data.forEach(task => {
      byStatus[task.status] = (byStatus[task.status] || 0) + 1;
      byPriority[task.priority] = (byPriority[task.priority] || 0) + 1;
      
      if (task.dueDate && task.status !== "DONE") {
        const due = new Date(task.dueDate);
        if (due < today) overdue++;
      }

      // We approximate completion date using updatedAt if completedAt is missing for some reason.
      if (task.status === "DONE") {
         const compDate = task.completedAt ? new Date(task.completedAt) : new Date(task.updatedAt);
         if (compDate >= weekAgo) completedThisWeek++;
      }
    });

    const completionRate = total > 0 ? byStatus.DONE / total : 0;

    return {
      total,
      byStatus,
      byPriority,
      overdue,
      completedThisWeek,
      completionRate,
    } as TaskStats;
  }, [allTasks.data]);

  return {
    data: stats,
    isLoading: allTasks.isLoading,
    isError: allTasks.isError,
    refetch: allTasks.refetch,
  };
}

export function useTodayTasks() {
  return useQuery({ queryKey: ["tasks", "today"], queryFn: fetchTodayTasks });
}