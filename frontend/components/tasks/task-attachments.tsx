"use client";

import { useRef, useState } from "react";
import { isAxiosError } from "axios";
import { FileText, FileImage, FileSpreadsheet, File as FileIcon, Trash2, UploadCloud } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAttachments, useUploadAttachment, useDeleteAttachment } from "@/lib/hooks/use-attachments";
import { cn } from "@/lib/utils";

// Mirrors backend/src/uploads/attachment-validation.pipe.ts ALLOWED_MIME_TYPES.
// Keep in sync if the backend allowlist changes.
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "text/plain",
]);

// Mirrors backend/src/config/env.validation.ts MAX_ATTACHMENT_SIZE_MB default.
// The backend is the source of truth (via MAX_ATTACHMENT_SIZE_MB) — if that
// env var changes, update this too.
const MAX_ATTACHMENT_SIZE_MB = 10;
const MAX_ATTACHMENT_SIZE_BYTES = MAX_ATTACHMENT_SIZE_MB * 1024 * 1024;

function iconForFileType(fileType: string): LucideIcon {
  if (fileType.startsWith("image/")) return FileImage;
  if (fileType.includes("sheet") || fileType.includes("excel")) return FileSpreadsheet;
  if (fileType === "application/pdf" || fileType.startsWith("text/") || fileType.includes("word")) return FileText;
  return FileIcon;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_MIME_TYPES.has(file.type)) {
    return `File type "${file.type || "unknown"}" isn't supported.`;
  }
  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return `File exceeds the maximum allowed size of ${MAX_ATTACHMENT_SIZE_MB}MB.`;
  }
  return null;
}

export function TaskAttachments({ taskId }: { taskId: string }) {
  const attachments = useAttachments(taskId);
  const upload = useUploadAttachment(taskId);
  const remove = useDeleteAttachment(taskId);

  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    setUploadError(null);
    const validationError = validateFile(file);
    if (validationError) {
      setUploadError(validationError);
      return;
    }

    setUploadProgress(0);
    upload.mutate(
      {
        file,
        onUploadProgress: (event) => {
          if (event.total) {
            setUploadProgress(Math.round((event.loaded / event.total) * 100));
          }
        },
      },
      {
        onError: (err) => {
          const message =
            isAxiosError(err) && err.response?.data?.message
              ? err.response.data.message
              : "Upload failed. Please try again.";
          setUploadError(Array.isArray(message) ? message[0] : message);
        },
        onSettled: () => setUploadProgress(null),
      },
    );
  };

  const handleDelete = (attachmentId: string) => {
    remove.mutate(attachmentId, {
      onSettled: () => setConfirmingDeleteId(null),
    });
  };

  return (
    <div className="space-y-1.5">
      <p className="text-sm font-medium text-foreground">Attachments</p>

      {attachments.isLoading && (
        <div className="space-y-2">
          {[0, 1].map((i) => (
            <div key={i} className="h-12 animate-pulse rounded-md bg-border" />
          ))}
        </div>
      )}

      {attachments.isError && (
        <p className="text-xs text-danger">Couldn&apos;t load attachments.</p>
      )}

      {attachments.data && attachments.data.length > 0 && (
        <div className="space-y-2">
          {attachments.data.map((attachment) => {
            const Icon = iconForFileType(attachment.fileType);
            const isConfirming = confirmingDeleteId === attachment._id;
            return (
              <div
                key={attachment._id}
                className="flex items-center gap-3 rounded-md border border-border px-3 py-2"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                
                  href={attachment.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 truncate text-sm text-foreground hover:underline"
                >
                  {attachment.fileName}
                </a>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatFileSize(attachment.fileSize)}
                </span>
                {isConfirming ? (
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button type="button" variant="outline" size="sm" onClick={() => setConfirmingDeleteId(null)}>
                      Cancel
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      className="bg-danger text-primary-foreground hover:bg-danger"
                      onClick={() => handleDelete(attachment._id)}
                      disabled={remove.isPending}
                    >
                      {remove.isPending ? "Deleting…" : "Delete"}
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmingDeleteId(attachment._id)}
                    className="shrink-0 text-muted-foreground hover:text-danger"
                    aria-label={`Delete ${attachment.fileName}`}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const file = e.dataTransfer.files?.[0];
          if (file) handleFile(file);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-3 py-5 text-center transition-colors",
          dragOver ? "border-primary bg-primary/5" : "border-border hover:bg-background-secondary",
        )}
      >
        <UploadCloud className="h-5 w-5 text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Drag a file here, or click to browse</p>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>

      {uploadProgress !== null && (
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-border">
          <div
            className="h-full rounded-full bg-primary transition-[width]"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}

      {uploadError && <p className="text-xs text-danger">{uploadError}</p>}
    </div>
  );
}