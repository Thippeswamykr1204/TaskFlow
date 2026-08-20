"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, User as UserIcon, Check, X } from "lucide-react";
import { isAxiosError } from "axios";
import { AuthShell } from "@/components/auth/auth-shell";
import { RegisterVisual } from "@/components/auth/register-visual";
import { ErrorBanner } from "@/components/auth/error-banner";
import { PasswordField } from "@/components/auth/password-field";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { registerRequest } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth-store";
import { registerSchema, type RegisterFormValues } from "@/lib/validation/auth-schemas";

export default function RegisterPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    formState: { errors, touchedFields, isSubmitting },
  } = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    mode: "onBlur",
  });

  const onSubmit = async (values: RegisterFormValues) => {
    setApiError(null);
    try {
      const { accessToken, user } = await registerRequest(values.name, values.email, values.password);
      setSession(accessToken, user);
      router.push("/dashboard");
    } catch (err) {
      if (isAxiosError(err) && err.response?.data?.message) {
        const msg = err.response.data.message;
        setApiError(Array.isArray(msg) ? msg[0] : msg);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <AuthShell rightPanel={<RegisterVisual />}>
      <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
        Create your account.
      </h1>
      <p className="mt-2 text-muted-foreground">Get started and take control of your tasks.</p>

      {apiError && (
        <div className="mt-6">
          <ErrorBanner message={apiError} onDismiss={() => setApiError(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="name">Full name</Label>
          <div className="relative">
            <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="name" placeholder="Alex Johnson" className="pl-10" {...register("name")} onBlur={() => trigger("name")} />
          </div>
          {touchedFields.name && !errors.name && (
            <p className="flex items-center gap-1 text-xs text-secondary-accent">
              <Check className="h-3 w-3" /> Looks good
            </p>
          )}
          {errors.name && (
            <p className="flex items-center gap-1 text-xs text-danger">
              <X className="h-3 w-3" /> {errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input id="email" type="email" placeholder="alex.johnson@example.com" className="pl-10" {...register("email")} />
          </div>
          {touchedFields.email && !errors.email && (
            <p className="flex items-center gap-1 text-xs text-secondary-accent">
              <Check className="h-3 w-3" /> Looks good
            </p>
          )}
          {errors.email && (
            <p className="flex items-center gap-1 text-xs text-danger">
              <X className="h-3 w-3" /> {errors.email.message}
            </p>
          )}
        </div>

        <PasswordField
          id="password"
          label="Password"
          registration={register("password")}
          error={errors.password?.message}
          touched={touchedFields.password}
        />

        <PasswordField
          id="confirmPassword"
          label="Confirm password"
          registration={register("confirmPassword")}
          error={errors.confirmPassword?.message}
          touched={touchedFields.confirmPassword}
        />

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Creating account…" : "Create account"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Login
        </Link>
      </p>
    </AuthShell>
  );
}