"use client";

import { useQuery } from "@tanstack/react-query";
import { fetchTaskActivity } from "@/lib/api/activity";

// Only meaningful in edit mode — enabled is false for a create-mode modal
// (or whenever taskId/enabled isn't ready), matching useAttachments' pattern.
export function useTaskActivity(taskId: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["tasks", "activity", taskId],
    queryFn: () => fetchTaskActivity(taskId as string),
    enabled: !!taskId && enabled,
  });
}