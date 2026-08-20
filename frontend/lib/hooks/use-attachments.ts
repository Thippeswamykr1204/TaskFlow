"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { AxiosProgressEvent } from "axios";
import { fetchAttachments, uploadAttachment, deleteAttachment } from "@/lib/api/attachments";

export function useAttachments(taskId: string | undefined) {
  return useQuery({
    queryKey: ["tasks", "attachments", taskId],
    queryFn: () => fetchAttachments(taskId as string),
    enabled: !!taskId,
  });
}

export function useUploadAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      file,
      onUploadProgress,
    }: {
      file: File;
      onUploadProgress?: (event: AxiosProgressEvent) => void;
    }) => uploadAttachment(taskId, file, onUploadProgress),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "attachments", taskId] });
    },
  });
}

export function useDeleteAttachment(taskId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attachmentId: string) => deleteAttachment(taskId, attachmentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tasks", "attachments", taskId] });
    },
  });
}