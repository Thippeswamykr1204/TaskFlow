"use client";

import { useRouter } from "next/navigation";
import { logoutRequest } from "@/lib/api/auth";
import { useAuthStore } from "@/lib/store/auth-store";

export function useLogout() {
  const router = useRouter();
  const clearSession = useAuthStore((state) => state.clearSession);

  return async () => {
    try {
      await logoutRequest();
    } finally {
      clearSession();
      router.replace("/login");
    }
  };
}
