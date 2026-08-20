import { Injectable, Inject } from '@nestjs/common';
import {
  GeocodingProvider,
  GEOCODING_PROVIDER,
} from './providers/geocoding.interface';
import {
  WeatherProvider,
  WeatherData,
  WEATHER_PROVIDER,
} from './providers/weather.interface';
import { InMemoryCache } from './cache/in-memory-cache';

@Injectable()
export class LocationService {
  private geocodingCache = new InMemoryCache<{ lat: number; lng: number }>();
  private weatherCache = new InMemoryCache<WeatherData>();

  // Geocoding: essentially static, cache ~30 days (2592000000 ms)
  private readonly GEOCODING_TTL_MS = 30 * 24 * 60 * 60 * 1000;

  // Weather: time-sensitive, cache ~20 minutes (1200000 ms)
  private readonly WEATHER_TTL_MS = 20 * 60 * 1000;

  constructor(
    @Inject(GEOCODING_PROVIDER)
    private readonly geocodingProvider: GeocodingProvider,
    @Inject(WEATHER_PROVIDER)
    private readonly weatherProvider: WeatherProvider,
  ) {}

  async resolveLocation(
    city: string,
  ): Promise<{ lat: number; lng: number } | null> {
    const cacheKey = `city:${city.toLowerCase()}`;
    const cached = this.geocodingCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.geocodingProvider.resolveCity(city);
    if (result) {
      this.geocodingCache.set(cacheKey, result, this.GEOCODING_TTL_MS);
    }

    return result;
  }

  async getWeatherForCity(city: string): Promise<WeatherData | null> {
    const location = await this.resolveLocation(city);
    if (!location) {
      return null;
    }

    return this.getWeatherForCoordinates(city, location.lat, location.lng);
  }

  private async getWeatherForCoordinates(
    city: string,
    lat: number,
    lng: number,
  ): Promise<WeatherData | null> {
    const cacheKey = `weather:${city.toLowerCase()}`;
    const cached = this.weatherCache.get(cacheKey);
    if (cached) {
      return cached;
    }

    const result = await this.weatherProvider.getCurrentWeather(lat, lng);
    if (result) {
      this.weatherCache.set(cacheKey, result, this.WEATHER_TTL_MS);
    }

    return result;
  }
}