import { api } from "@/lib/api";
import type { User } from "@/types/user";

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export async function loginRequest(email: string, password: string) {
  const res = await api.post<AuthResponse>("/auth/login", { email, password });
  return res.data;
}

export async function registerRequest(name: string, email: string, password: string) {
  const res = await api.post<AuthResponse>("/auth/register", { name, email, password });
  return res.data;
}

export async function refreshRequest() {
  const res = await api.post<AuthResponse>("/auth/refresh");
  return res.data;
}

export async function logoutRequest() {
  await api.post("/auth/logout");
}

export async function updateProfileRequest(data: { name?: string; email?: string }) {
  const res = await api.patch<User>("/auth/me", data);
  return res.data;
}