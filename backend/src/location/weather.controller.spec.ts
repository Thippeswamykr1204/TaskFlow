import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WeatherController } from './weather.controller';
import { LocationService } from './location.service';
import { WeatherData } from './providers/weather.interface';

describe('WeatherController', () => {
  let controller: WeatherController;
  let locationService: LocationService;

  const mockWeatherData: WeatherData = {
    tempC: 25,
    feelsLikeC: 27,
    condition: 'Rainy',
    description: 'Light rain',
    humidity: 65,
    windKph: 12,
    icon: '09d',
  };

  beforeEach(async () => {
    const mockLocationService = {
      getWeatherForCity: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [WeatherController],
      providers: [
        {
          provide: LocationService,
          useValue: mockLocationService,
        },
      ],
    }).compile();

    controller = module.get<WeatherController>(WeatherController);
    locationService = module.get<LocationService>(LocationService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWeather', () => {
    it('should return weather for valid city', async () => {
      jest
        .spyOn(locationService, 'getWeatherForCity')
        .mockResolvedValue(mockWeatherData);

      const result = await controller.getWeather('Bengaluru');

      expect(result).toEqual({
        success: true,
        data: mockWeatherData,
      });
      expect(locationService.getWeatherForCity).toHaveBeenCalledWith(
        'Bengaluru',
      );
    });

    it('should throw 404 for unresolvable city', async () => {
      jest
        .spyOn(locationService, 'getWeatherForCity')
        .mockResolvedValue(null);

      await expect(controller.getWeather('UnknownCity')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw 404 if city is empty', async () => {
      await expect(controller.getWeather('')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});