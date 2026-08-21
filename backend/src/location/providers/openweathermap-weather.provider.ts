import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { WeatherProvider, WeatherData } from './weather.interface';
import { EnvConfig } from '../../config/env.validation';

@Injectable()
export class OpenWeatherMapWeatherProvider implements WeatherProvider {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.openweathermap.org/data/2.5';

  constructor(
    private readonly configService: ConfigService<EnvConfig, true>,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.get('OPENWEATHER_API_KEY', {
      infer: true,
    });
  }

  async getCurrentWeather(
    lat: number,
    lng: number,
  ): Promise<WeatherData | null> {
    try {
      const url = `${this.baseUrl}/weather`;
      const response = await firstValueFrom(
        this.httpService.get<OpenWeatherResponse>(url),
      );

      const data = response.data;

      interface OpenWeatherResponse {
        main: {
          temp: number;
          feels_like: number;
          humidity: number;
        };
        weather: Array<{
          main: string;
          description: string;
          icon: string;
        }>;
        wind: {
          speed: number;
        };
      }

      if (!data || !data.main || !data.weather) {
        return null;
      }

      return {
        tempC: data.main.temp,
        feelsLikeC: data.main.feels_like,
        condition: data.weather[0].main,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windKph: data.wind.speed * 3.6,
        icon: data.weather[0].icon,
      };
    } catch {
      return null;
    }
  }
}