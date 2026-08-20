import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { AuthModule } from '../src/auth/auth.module';

describe('Auth (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
          ignoreEnvFile: true,
          load: [
            () => ({
              NODE_ENV: 'test',
              PORT: 3000,
              MONGO_URI: mongoUri,
              JWT_ACCESS_SECRET: 'test_access_secret_long_enough_123',
              JWT_REFRESH_SECRET: 'test_refresh_secret_long_enough_456',
              CORS_ORIGIN: 'http://localhost:3001',
            }),
          ],
        }),
        AppModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('POST /auth/register', () => {
    it('should register a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'John Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.user).toBeDefined();
          expect(res.body.user.email).toBe('john@example.com');
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user.passwordHash).toBeUndefined();
        });
    });

    it('should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Jane Doe',
          email: 'john@example.com',
          password: 'SecurePass123!',
        })
        .expect(409);
    });

    it('should reject invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Test',
          email: 'test@example.com',
          password: 'weak',
        })
        .expect(400);
    });
  });

  describe('POST /auth/login', () => {
    beforeAll(() => {
      return request(app.getHttpServer())
        .post('/auth/register')
        .send({
          name: 'Login Test',
          email: 'login@example.com',
          password: 'SecurePass123!',
        });
    });

    it('should login user with valid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
          expect(res.body.user.email).toBe('login@example.com');
        });
    });

    it('should reject invalid password', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!',
        })
        .expect(401);
    });

    it('should reject non-existent email', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'nonexistent@example.com',
          password: 'SecurePass123!',
        })
        .expect(401);
    });
  });

  describe('GET /auth/me', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!',
        });
      accessToken = res.body.accessToken;
    });

    it('should return current user with valid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body._id).toBeDefined();
          expect(res.body.email).toBe('login@example.com');
        });
    });

    it('should reject request without auth header', () => {
      return request(app.getHttpServer()).get('/auth/me').expect(401);
    });

    it('should reject invalid token', () => {
      return request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', 'Bearer invalid_token')
        .expect(401);
    });
  });

  describe('POST /auth/logout', () => {
    let accessToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!',
        });
      accessToken = res.body.accessToken;
    });

    it('should logout user and revoke session', () => {
      return request(app.getHttpServer())
        .post('/auth/logout')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(204);
    });

    it('should reject logout without auth', () => {
      return request(app.getHttpServer()).post('/auth/logout').expect(401);
    });
  });

  describe('POST /auth/refresh', () => {
    let refreshToken: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!',
        });
      refreshToken = res.headers['set-cookie']
        ?.find((c: string) => c.startsWith('refreshToken='))
        ?.split(';')[0]
        ?.split('=')[1];
    });

    it('should refresh access token with valid refresh token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${refreshToken}`])
        .expect(200)
        .expect((res) => {
          expect(res.body.accessToken).toBeDefined();
        });
    });

    it('should reject refresh without token', () => {
      return request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);
    });

    it('should allow token rotation: login → refresh → refresh again', async () => {
      // Register and login to get initial refresh token
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'login@example.com',
          password: 'SecurePass123!',
        });

      const initialRefreshToken = loginRes.headers['set-cookie']
        ?.find((c: string) => c.startsWith('refreshToken='))
        ?.split(';')[0]
        ?.split('=')[1];

      expect(initialRefreshToken).toBeDefined();

      // First refresh with initial token
      const firstRefreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${initialRefreshToken}`])
        .expect(200);

      expect(firstRefreshRes.body.accessToken).toBeDefined();

      const secondRefreshToken = firstRefreshRes.headers['set-cookie']
        ?.find((c: string) => c.startsWith('refreshToken='))
        ?.split(';')[0]
        ?.split('=')[1];

      expect(secondRefreshToken).toBeDefined();
      expect(secondRefreshToken).not.toBe(initialRefreshToken);

      // Second refresh with rotated token - this was the broken part before the fix
      const secondRefreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', [`refreshToken=${secondRefreshToken}`])
        .expect(200);

      expect(secondRefreshRes.body.accessToken).toBeDefined();
      expect(secondRefreshRes.body.user).toBeDefined();
    });
  });
});