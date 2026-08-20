/**
 * Weather provider interface. Implementations fetch current weather
 * for given coordinates.
 */
export interface WeatherData {
  tempC: number;
  feelsLikeC: number;
  condition: string;
  description: string;
  humidity: number;
  windKph: number;
  icon: string;
}

export interface WeatherProvider {
  getCurrentWeather(
    lat: number,
    lng: number,
  ): Promise<WeatherData | null>;
}

export const WEATHER_PROVIDER = Symbol('WEATHER_PROVIDER');