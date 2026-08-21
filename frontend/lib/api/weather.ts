import { api } from "@/lib/api";

export interface WeatherData {
  tempC: number;
  feelsLikeC: number;
  condition: string;
  description: string;
  humidity: number;
  windKph: number;
  icon: string;
}

interface WeatherEnvelope {
  success: true;
  data: WeatherData;
}

/**
 * Fetch current weather for a city via GET /weather?city=<city>.
 * A 404 (WEATHER_UNAVAILABLE) means the backend couldn't resolve the
 * location — callers should treat that as a normal "no data" case, not an
 * unexpected error. useWeather's retry config already disables retrying on
 * 404s; this function just lets the AxiosError propagate so that logic can
 * see the real status code.
 */
export async function fetchWeather(city: string): Promise<WeatherData> {
  const { data } = await api.get<WeatherEnvelope>("/weather", {
    params: { city },
  });
  return data.data;
}
