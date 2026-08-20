import {
  Controller,
  Get,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { LocationService } from './location.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WeatherData } from './providers/weather.interface';

@ApiTags('weather')
@Controller('weather')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WeatherController {
  constructor(private readonly locationService: LocationService) {}

  @Get()
  @ApiOperation({
    summary: 'Get current weather for a city',
    description:
      'Resolves city name to coordinates and fetches current weather. Results are cached per city.',
  })
  @ApiQuery({
    name: 'city',
    type: String,
    description: 'City name to get weather for (e.g., Bengaluru, London)',
  })
  @ApiResponse({
    status: 200,
    description: 'Weather data retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        data: {
          type: 'object',
          properties: {
            tempC: { type: 'number' },
            feelsLikeC: { type: 'number' },
            condition: { type: 'string' },
            description: { type: 'string' },
            humidity: { type: 'number' },
            windKph: { type: 'number' },
            icon: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Could not resolve weather for this location',
    schema: {
      type: 'object',
      properties: {
        error: { type: 'string', example: 'WEATHER_UNAVAILABLE' },
        message: { type: 'string' },
      },
    },
  })
  async getWeather(
    @Query('city') city: string,
  ): Promise<{ success: boolean; data: WeatherData }> {
    if (!city || !city.trim()) {
      throw new NotFoundException({
        error: 'WEATHER_UNAVAILABLE',
        message: 'Could not resolve weather for this location',
      });
    }

    const weather = await this.locationService.getWeatherForCity(city);
    if (!weather) {
      throw new NotFoundException({
        error: 'WEATHER_UNAVAILABLE',
        message: 'Could not resolve weather for this location',
      });
    }

    return {
      success: true,
      data: weather,
    };
  }
}