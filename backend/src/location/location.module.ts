import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LocationService } from './location.service';
import { WeatherController } from './weather.controller';
import { OpenWeatherMapGeocodingProvider } from './providers/openweathermap-geocoding.provider';
import { OpenWeatherMapWeatherProvider } from './providers/openweathermap-weather.provider';
import {
  GeocodingProvider,
  GEOCODING_PROVIDER,
} from './providers/geocoding.interface';
import {
  WeatherProvider,
  WEATHER_PROVIDER,
} from './providers/weather.interface';

@Module({
  imports: [HttpModule],
  controllers: [WeatherController],
  providers: [
    LocationService,
    {
      provide: GEOCODING_PROVIDER,
      useClass: OpenWeatherMapGeocodingProvider,
    } as unknown as {
      provide: typeof GEOCODING_PROVIDER;
      useClass: typeof OpenWeatherMapGeocodingProvider;
    },
    {
      provide: WEATHER_PROVIDER,
      useClass: OpenWeatherMapWeatherProvider,
    } as unknown as {
      provide: typeof WEATHER_PROVIDER;
      useClass: typeof OpenWeatherMapWeatherProvider;
    },
  ],
  exports: [LocationService],
})
export class LocationModule {}