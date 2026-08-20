import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadGatewayException } from '@nestjs/common';
import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryService } from './cloudinary.service';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(),
    uploader: {
      upload_stream: jest.fn(),
      destroy: jest.fn(),
    },
  },
}));

describe('CloudinaryService', () => {
  let service: CloudinaryService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn((key: string) => {
        const values: Record<string, unknown> = {
          CLOUDINARY_CLOUD_NAME: 'test-cloud',
          CLOUDINARY_API_KEY: 'test-key',
          CLOUDINARY_API_SECRET: 'test-secret',
        };
        return values[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CloudinaryService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<CloudinaryService>(CloudinaryService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('upload', () => {
    it('resolves with url, publicId, and resourceType on success', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          callback(null, {
            secure_url: 'https://res.cloudinary.com/test/image/upload/abc.png',
            public_id: 'taskflow/attachments/abc',
            resource_type: 'image',
          });
          return { end: jest.fn() };
        },
      );

      const result = await service.upload(Buffer.from('fake'), {
        resourceType: 'image',
      });

      expect(result).toEqual({
        url: 'https://res.cloudinary.com/test/image/upload/abc.png',
        publicId: 'taskflow/attachments/abc',
        resourceType: 'image',
      });
    });

    it('rejects with BadGatewayException on Cloudinary error', async () => {
      (cloudinary.uploader.upload_stream as jest.Mock).mockImplementation(
        (_options, callback) => {
          callback(new Error('network blip'), undefined);
          return { end: jest.fn() };
        },
      );

      await expect(
        service.upload(Buffer.from('fake'), { resourceType: 'image' }),
      ).rejects.toThrow(BadGatewayException);
    });
  });

  describe('destroy', () => {
    it('resolves when Cloudinary reports ok', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'ok' });

      await expect(service.destroy('abc', 'image')).resolves.toBeUndefined();
      expect(cloudinary.uploader.destroy).toHaveBeenCalledWith('abc', {
        resource_type: 'image',
      });
    });

    it('resolves when Cloudinary reports not found (already gone)', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'not found' });

      await expect(service.destroy('abc', 'image')).resolves.toBeUndefined();
    });

    it('throws BadGatewayException on any other result', async () => {
      (cloudinary.uploader.destroy as jest.Mock).mockResolvedValue({ result: 'error' });

      await expect(service.destroy('abc', 'image')).rejects.toThrow(BadGatewayException);
    });
  });
});