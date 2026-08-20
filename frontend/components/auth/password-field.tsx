"use client";

import { useState } from "react";
import { Lock, Eye, EyeOff, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function PasswordField({
  id,
  label,
  registration,
  error,
  touched,
}: {
  id: string;
  label: string;
  registration: ReturnType<any>;
  error?: string;
  touched?: boolean;
}) {
  const [show, setShow] = useState(false);
  const isValid = touched && !error;
  const isInvalid = touched && !!error;

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id={id}
          type={show ? "text" : "password"}
          className={cn("px-10", isInvalid && "border-danger focus-visible:ring-danger/30")}
          {...registration}
        />
        <button
          type="button"
          onClick={() => setShow((v) => !v)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
      {isValid && (
        <p className="flex items-center gap-1 text-xs text-secondary-accent">
          <Check className="h-3 w-3" /> Looks good
        </p>
      )}
      {isInvalid && (
        <p className="flex items-center gap-1 text-xs text-danger">
          <X className="h-3 w-3" /> {error}
        </p>
      )}
    </div>
  );
}