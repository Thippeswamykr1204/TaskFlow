import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GeocodingProvider } from './geocoding.interface';
import { EnvConfig } from '../../config/env.validation';

@Injectable()
export class OpenWeatherMapGeocodingProvider implements GeocodingProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/geo/1.0';

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get('OPENWEATHER_API_KEY', {
      infer: true,
    });
  }

  async resolveCity(
    city: string,
  ): Promise<{ lat: number; lng: number } | null> {
    try {
      const url = `${this.baseUrl}/direct`;
      const response = await firstValueFrom(
        this.httpService.get<Array<{ lat: number; lon: number }>>(url, {
          params: {
            q: city,
            limit: 1,
            appid: this.apiKey,
          },
        }),
      );

      const data = response.data as Array<{
        lat: number;
        lon: number;
      }>;

      if (!data || data.length === 0) {
        return null;
      }

      return {
        lat: data[0].lat,
        lng: data[0].lon,
      };
    } catch {
      return null;
    }
  }
}