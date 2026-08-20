"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTaskStats, fetchTodayTasks } from "@/lib/api/tasks";

export function useTaskStats() {
  return useQuery({ queryKey: ["tasks", "stats"], queryFn: fetchTaskStats });
}

export function useTodayTasks() {
  return useQuery({ queryKey: ["tasks", "today"], queryFn: fetchTodayTasks });
}