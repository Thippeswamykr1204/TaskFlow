import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { OpenWeatherMapWeatherProvider } from './openweathermap-weather.provider';

describe('OpenWeatherMapWeatherProvider', () => {
  let provider: OpenWeatherMapWeatherProvider;
  let httpService: HttpService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-api-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenWeatherMapWeatherProvider,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: HttpService,
          useValue: {
            get: jest.fn(),
          },
        },
      ],
    }).compile();

    provider = module.get<OpenWeatherMapWeatherProvider>(
      OpenWeatherMapWeatherProvider,
    );
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should fetch current weather', async () => {
    const mockResponse = {
      data: {
        main: {
          temp: 25,
          feels_like: 27,
          humidity: 65,
        },
        weather: [
          {
            main: 'Rainy',
            description: 'Light rain',
            icon: '09d',
          },
        ],
        wind: {
          speed: 3.33,
        },
      },
    };

    jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as any));

    const result = await provider.getCurrentWeather(12.9716, 77.5946);

    expect(result).toEqual({
      tempC: 25,
      feelsLikeC: 27,
      condition: 'Rainy',
      description: 'Light rain',
      humidity: 65,
      windKph: expect.any(Number),
      icon: '09d',
    });
  });

  it('should return null on HTTP error', async () => {
    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(
        of(new Error('Network error') as any),
      );

    const result = await provider.getCurrentWeather(12.9716, 77.5946);

    expect(result).toBeNull();
  });
});