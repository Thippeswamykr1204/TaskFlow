import axios from "axios";

/**
 * Shared Axios instance for talking to the TaskFlow backend.
 * `withCredentials: true` so refresh-token cookies (Tier 1+) are sent
 * automatically. Interceptors for auth/error handling land in later tiers.
 */
export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
});
