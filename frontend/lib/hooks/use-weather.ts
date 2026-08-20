"use client";

import { useQuery } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { fetchWeather } from "@/lib/api/weather";

// staleTime matches the backend's own weather cache window (20 min, see
// LocationService.WEATHER_TTL_MS) — no point refetching more often than
// the backend would return fresh data.
const WEATHER_STALE_TIME_MS = 20 * 60 * 1000;

export function useWeather(city: string | undefined) {
  return useQuery({
    queryKey: ["weather", city],
    queryFn: () => fetchWeather(city as string),
    enabled: !!city,
    staleTime: WEATHER_STALE_TIME_MS,
    retry: (failureCount, err) => {
      if (isAxiosError(err) && err.response?.status === 404) return false;
      return failureCount < 3;
    },
  });
}