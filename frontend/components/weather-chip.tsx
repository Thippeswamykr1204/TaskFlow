"use client";

import type { LucideIcon } from "lucide-react";
import { Sun, CloudSun, Cloud, CloudRain, CloudLightning, CloudSnow, CloudFog } from "lucide-react";
import { useWeather } from "@/lib/hooks/use-weather";
import { cn } from "@/lib/utils";

const CONDITION_ICON: Record<string, LucideIcon> = {
  clear: Sun,
  clouds: Cloud,
  rain: CloudRain,
  drizzle: CloudRain,
  thunderstorm: CloudLightning,
  snow: CloudSnow,
  mist: CloudFog,
  fog: CloudFog,
  haze: CloudFog,
  smoke: CloudFog,
};

function iconForCondition(condition?: string): LucideIcon {
  if (!condition) return CloudSun;
  return CONDITION_ICON[condition.toLowerCase()] ?? CloudSun;
}

interface WeatherChipProps {
  city?: string;
  /**
   * "field" — used next to a form field; shows a muted "unavailable" message
   * when there's no data. "pill" — used alongside other pills (e.g. TaskRow);
   * renders nothing when there's no data, rather than adding noise.
   */
  variant?: "field" | "pill";
  className?: string;
}

export function WeatherChip({ city, variant = "pill", className }: WeatherChipProps) {
  const { data, isLoading, isError } = useWeather(city);

  if (!city) return null;

  if (isLoading) {
    return (
      <span
        className={cn("inline-block h-6 w-24 animate-pulse rounded-full bg-border", className)}
        aria-label="Loading weather"
      />
    );
  }

  if (isError || !data) {
    if (variant === "field") {
      return <p className={cn("text-xs text-muted-foreground", className)}>Weather unavailable for this location</p>;
    }
    return null;
  }

  const Icon = iconForCondition(data.condition);

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-xs font-medium text-foreground",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {Math.round(data.tempC)}°C
      <span className="text-muted-foreground">{data.condition}</span>
    </span>
  );
}