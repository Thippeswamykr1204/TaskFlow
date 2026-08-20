import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { of } from 'rxjs';
import { OpenWeatherMapGeocodingProvider } from './openweathermap-geocoding.provider';

describe('OpenWeatherMapGeocodingProvider', () => {
  let provider: OpenWeatherMapGeocodingProvider;
  let httpService: HttpService;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('test-api-key'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenWeatherMapGeocodingProvider,
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

    provider = module.get<OpenWeatherMapGeocodingProvider>(
      OpenWeatherMapGeocodingProvider,
    );
    httpService = module.get<HttpService>(HttpService);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });

  it('should resolve city to coordinates', async () => {
    const mockResponse = {
      data: [{ lat: 12.9716, lon: 77.5946 }],
    };

    jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as any));

    const result = await provider.resolveCity('Bengaluru');

    expect(result).toEqual({ lat: 12.9716, lng: 77.5946 });
  });

  it('should return null for unresolvable city', async () => {
    const mockResponse = { data: [] };

    jest.spyOn(httpService, 'get').mockReturnValue(of(mockResponse as any));

    const result = await provider.resolveCity('UnknownCity');

    expect(result).toBeNull();
  });

  it('should return null on HTTP error', async () => {
    jest
      .spyOn(httpService, 'get')
      .mockReturnValue(
        of(new Error('Network error') as any),
      );

    const result = await provider.resolveCity('Bengaluru');

    expect(result).toBeNull();
  });
});