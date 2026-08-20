"use client";

import { AlertCircle, X } from "lucide-react";

export function ErrorBanner({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-md border-l-4 border-danger bg-danger-bg px-4 py-3">
      <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-danger" />
      <p className="flex-1 text-sm text-foreground">{message}</p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}