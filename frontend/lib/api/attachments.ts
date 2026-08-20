import type { AxiosProgressEvent } from "axios";
import { api } from "@/lib/api";

export interface Attachment {
  _id: string;
  url: string;
  publicId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  resourceType: "image" | "raw" | "video";
  task: string;
  createdAt: string;
  updatedAt: string;
}

export async function fetchAttachments(taskId: string): Promise<Attachment[]> {
  const res = await api.get<{ success: boolean; data: Attachment[] }>(`/tasks/${taskId}/attachments`);
  return res.data.data;
}

export async function uploadAttachment(
  taskId: string,
  file: File,
  onUploadProgress?: (event: AxiosProgressEvent) => void,
): Promise<Attachment> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await api.post<{ success: boolean; data: Attachment }>(
    `/tasks/${taskId}/attachments`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress,
    },
  );
  return res.data.data;
}

export async function deleteAttachment(taskId: string, attachmentId: string): Promise<void> {
  await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
}