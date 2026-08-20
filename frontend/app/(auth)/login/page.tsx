"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { isAxiosError } from "axios";
import { AuthShell } from "@/components/auth/auth-shell";
import { LoginVisual } from "@/components/auth/login-visual";
import { ErrorBanner } from "@/components/auth/error-banner";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { loginRequest } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth-store";
import { loginSchema, type LoginFormValues } from "@/lib/validation/auth-schemas";

export default function LoginPage() {
  const router = useRouter();
  const setSession = useAuthStore((s) => s.setSession);
  const [showPassword, setShowPassword] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (values: LoginFormValues) => {
    setApiError(null);
    try {
      const { accessToken, user } = await loginRequest(values.email, values.password);
      setSession(accessToken, user);
      router.push("/dashboard");
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 401) {
        setApiError("Invalid credentials — the email or password you entered is incorrect.");
      } else if (isAxiosError(err) && err.response?.data?.message) {
        const msg = err.response.data.message;
        setApiError(Array.isArray(msg) ? msg[0] : msg);
      } else {
        setApiError("Something went wrong. Please try again.");
      }
    }
  };

  return (
    <AuthShell rightPanel={<LoginVisual />}>
      <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
        Welcome back.
      </h1>
      <p className="mt-2 text-muted-foreground">
        Log in to your private workspace to get things done.
      </p>

      {apiError && (
        <div className="mt-6">
          <ErrorBanner message={apiError} onDismiss={() => setApiError(null)} />
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              {...register("email")}
            />
          </div>
          {errors.email && <p className="text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              className="px-10"
              {...register("password")}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-danger">{errors.password.message}</p>}
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <Checkbox />
            Remember me
          </label>
          <span className="cursor-not-allowed text-sm text-primary opacity-70" title="Coming soon">
            Forgot password?
          </span>
        </div>

        <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? "Logging in…" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium text-primary hover:underline">
          Register
        </Link>
      </p>
    </AuthShell>
  );
}