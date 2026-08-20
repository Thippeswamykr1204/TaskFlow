import { Test, TestingModule } from '@nestjs/testing';
import { LocationService } from './location.service';
import {
  GeocodingProvider,
  GEOCODING_PROVIDER,
} from './providers/geocoding.interface';
import {
  WeatherProvider,
  WEATHER_PROVIDER,
  WeatherData,
} from './providers/weather.interface';

describe('LocationService', () => {
  let service: LocationService;
  let geocodingProvider: GeocodingProvider;
  let weatherProvider: WeatherProvider;

  beforeEach(async () => {
    const mockGeocodingProvider: GeocodingProvider = {
      resolveCity: jest.fn(),
    };

    const mockWeatherProvider: WeatherProvider = {
      getCurrentWeather: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationService,
        {
          provide: GEOCODING_PROVIDER,
          useValue: mockGeocodingProvider,
        },
        {
          provide: WEATHER_PROVIDER,
          useValue: mockWeatherProvider,
        },
      ],
    }).compile();

    service = module.get<LocationService>(LocationService);
    geocodingProvider = module.get<GeocodingProvider>(GEOCODING_PROVIDER);
    weatherProvider = module.get<WeatherProvider>(WEATHER_PROVIDER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('resolveLocation', () => {
    it('should resolve city to coordinates', async () => {
      const mockCoords = { lat: 12.9716, lng: 77.5946 };
      jest
        .spyOn(geocodingProvider, 'resolveCity')
        .mockResolvedValue(mockCoords);

      const result = await service.resolveLocation('Bengaluru');

      expect(result).toEqual(mockCoords);
      expect(geocodingProvider.resolveCity).toHaveBeenCalledWith('Bengaluru');
    });

    it('should return null for unresolvable city', async () => {
      jest.spyOn(geocodingProvider, 'resolveCity').mockResolvedValue(null);

      const result = await service.resolveLocation('UnknownCity');

      expect(result).toBeNull();
    });

    it('should cache geocoding results and not call provider twice within TTL', async () => {
      const mockCoords = { lat: 12.9716, lng: 77.5946 };
      jest
        .spyOn(geocodingProvider, 'resolveCity')
        .mockResolvedValue(mockCoords);

      const result1 = await service.resolveLocation('Bengaluru');
      const result2 = await service.resolveLocation('Bengaluru');

      expect(result1).toEqual(mockCoords);
      expect(result2).toEqual(mockCoords);
      expect(geocodingProvider.resolveCity).toHaveBeenCalledTimes(1);
    });

    it('should handle null from provider without throwing', async () => {
      jest.spyOn(geocodingProvider, 'resolveCity').mockResolvedValue(null);

      const result = await service.resolveLocation('BadCity');

      expect(result).toBeNull();
      expect(geocodingProvider.resolveCity).toHaveBeenCalled();
    });
  });

  describe('getWeatherForCity', () => {
    it('should resolve city and fetch weather', async () => {
      const mockCoords = { lat: 12.9716, lng: 77.5946 };
      const mockWeather: WeatherData = {
        tempC: 25,
        feelsLikeC: 27,
        condition: 'Rainy',
        description: 'Light rain',
        humidity: 65,
        windKph: 12,
        icon: '09d',
      };

      jest
        .spyOn(geocodingProvider, 'resolveCity')
        .mockResolvedValue(mockCoords);
      jest
        .spyOn(weatherProvider, 'getCurrentWeather')
        .mockResolvedValue(mockWeather);

      const result = await service.getWeatherForCity('Bengaluru');

      expect(result).toEqual(mockWeather);
      expect(geocodingProvider.resolveCity).toHaveBeenCalledWith('Bengaluru');
      expect(weatherProvider.getCurrentWeather).toHaveBeenCalledWith(
        mockCoords.lat,
        mockCoords.lng,
      );
    });

    it('should return null if city cannot be resolved', async () => {
      jest.spyOn(geocodingProvider, 'resolveCity').mockResolvedValue(null);

      const result = await service.getWeatherForCity('UnknownCity');

      expect(result).toBeNull();
      expect(weatherProvider.getCurrentWeather).not.toHaveBeenCalled();
    });

    it('should cache weather results and not call provider twice within TTL', async () => {
      const mockCoords = { lat: 12.9716, lng: 77.5946 };
      const mockWeather: WeatherData = {
        tempC: 25,
        feelsLikeC: 27,
        condition: 'Rainy',
        description: 'Light rain',
        humidity: 65,
        windKph: 12,
        icon: '09d',
      };

      jest
        .spyOn(geocodingProvider, 'resolveCity')
        .mockResolvedValue(mockCoords);
      jest
        .spyOn(weatherProvider, 'getCurrentWeather')
        .mockResolvedValue(mockWeather);

      const result1 = await service.getWeatherForCity('Bengaluru');
      const result2 = await service.getWeatherForCity('Bengaluru');

      expect(result1).toEqual(mockWeather);
      expect(result2).toEqual(mockWeather);
      expect(weatherProvider.getCurrentWeather).toHaveBeenCalledTimes(1);
    });
  });
});