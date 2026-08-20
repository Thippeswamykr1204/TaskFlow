"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/store/auth-store";
import { refreshRequest } from "@/lib/api/auth";
import { SessionLoadingScreen } from "@/components/auth/session-loading-screen";

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const router = useRouter();
  const accessToken = useAuthStore((s) => s.accessToken);
  const setSession = useAuthStore((s) => s.setSession);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (accessToken) {
      setChecking(false);
      return;
    }

    let cancelled = false;

    // A page refresh wipes Zustand's in-memory token, but the HttpOnly
    // refresh cookie survives — try to silently re-establish the session.
    refreshRequest()
      .then(({ accessToken: token, user }) => {
        if (cancelled) return;
        setSession(token, user);
        setChecking(false);
      })
      .catch(() => {
        if (cancelled) return;
        router.replace("/login");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (checking) {
    return <SessionLoadingScreen />;
  }

  return <>{children}</>;
}