import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { User } from './schemas/user.schema';
import { Session } from './schemas/session.schema';

jest.mock('bcryptjs');

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockSessionModel: any;
  let jwtService: JwtService;

  beforeEach(async () => {
    // Constructable mock: AuthService.register calls `new this.userModel(data)`,
    // so the mock must be a jest.fn() usable as a constructor, with the static
    // query methods attached via Object.assign — same pattern used for the
    // Task/Attachment mock models elsewhere in this suite.
    mockUserModel = jest.fn();
    Object.assign(mockUserModel, {
      findOne: jest.fn(),
      findById: jest.fn(),
    });
    mockSessionModel = jest.fn().mockImplementation((data: any) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: 'session_id', ...data }),
    }));
    Object.assign(mockSessionModel, {
      findOne: jest.fn(),
      updateOne: jest.fn(),
      updateMany: jest.fn(),
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: mockUserModel,
        },
        {
          provide: getModelToken(Session.name),
          useValue: mockSessionModel,
        },
        {
          provide: JwtService,
          useValue: { sign: jest.fn(), verify: jest.fn() },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn((key) => {
              if (key === 'JWT_ACCESS_SECRET') return 'access_secret_long_enough';
              if (key === 'JWT_REFRESH_SECRET') return 'refresh_secret_long_enough';
            }),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    it('should hash password and create user', async () => {
      const dto = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const mockUser = {
        _id: 'user_id_123',
        ...dto,
        save: jest.fn(),
        toObject: jest.fn().mockReturnValue(dto),
      };

      mockUserModel.findOne.mockResolvedValue(null);
      mockUserModel.mockImplementation(() => mockUser);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashed_password');

      const result = await service.register(dto);

      expect(bcrypt.hash).toHaveBeenCalledWith(dto.password, 12);
      expect(mockUser.save).toHaveBeenCalled();
      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
    });

    it('should throw ConflictException if email exists', async () => {
      const dto = {
        name: 'Test User',
        email: 'existing@example.com',
        password: 'SecurePass123!',
      };

      mockUserModel.findOne.mockResolvedValue({ email: dto.email });

      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('should return user and accessToken on valid credentials', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'SecurePass123!',
      };

      const mockUser = {
        _id: 'user_id_123',
        email: dto.email,
        passwordHash: 'hashed_password',
        toObject: jest.fn().mockReturnValue({ email: dto.email }),
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.login(dto, 'Mozilla/5.0', '127.0.0.1');

      expect(result.user).toBeDefined();
      expect(result.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException on invalid credentials', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      mockUserModel.findOne.mockResolvedValue(null);

      await expect(service.login(dto, '', '')).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException on invalid password', async () => {
      const dto = {
        email: 'test@example.com',
        password: 'WrongPassword123!',
      };

      const mockUser = {
        email: dto.email,
        passwordHash: 'hashed_password',
      };

      mockUserModel.findOne.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(dto, '', '')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('refresh', () => {
    it('should rotate tokens on valid refresh', async () => {
      const refreshToken = 'valid_refresh_token';
      const userId = 'user_id_123';

      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: userId,
        email: 'test@example.com',
      });

      const mockSession = {
        _id: 'session_id',
        expiresAt: new Date(Date.now() + 1000 * 60 * 60),
      };

      mockSessionModel.findOne.mockResolvedValue(mockSession);

      const mockUser = {
        _id: userId,
        email: 'test@example.com',
        toObject: jest.fn().mockReturnValue({ email: 'test@example.com' }),
      };

      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.refresh(refreshToken, '', '');

      expect(mockSessionModel.updateOne).toHaveBeenCalledWith(
        { _id: mockSession._id },
        { revokedAt: expect.any(Date) },
      );
      expect(result.accessToken).toBeDefined();
    });

    it('should throw UnauthorizedException on expired session', async () => {
      const refreshToken = 'expired_token';

      (jwtService.verify as jest.Mock).mockReturnValue({
        sub: 'user_id',
        email: 'test@example.com',
      });

      mockSessionModel.findOne.mockResolvedValue(null);

      await expect(service.refresh(refreshToken, '', '')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('logout', () => {
    it('should revoke all non-revoked sessions for user', async () => {
      const userId = 'user_id_123';

      await service.logout(userId);

      expect(mockSessionModel.updateMany).toHaveBeenCalledWith(
        { user: userId, revokedAt: null },
        { revokedAt: expect.any(Date) },
      );
    });
  });
});