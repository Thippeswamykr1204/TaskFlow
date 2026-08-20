import { create } from "zustand";
import type { User } from "@/types/user";

interface AuthState {
  accessToken: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setSession: (accessToken: string, user: User) => void;
  clearSession: () => void;
}

// Access token lives in memory only — never persisted to localStorage/sessionStorage.
export const useAuthStore = create<AuthState>((set) => ({
  accessToken: null,
  user: null,
  isAuthenticated: false,
  setSession: (accessToken, user) =>
    set({ accessToken, user, isAuthenticated: true }),
  clearSession: () => set({ accessToken: null, user: null, isAuthenticated: false }),
}));