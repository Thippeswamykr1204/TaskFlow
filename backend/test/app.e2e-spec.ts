import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';

// App-level smoke test. This intentionally does NOT duplicate the
// auth-flow assertions in auth.e2e-spec.ts (register/login/refresh/logout
// belong there) — this file only confirms AppModule boots end-to-end and
// the top-level health route responds.
describe('App (e2e)', () => {
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
              CLOUDINARY_CLOUD_NAME: 'test-cloud',
              CLOUDINARY_API_KEY: 'test-key',
              CLOUDINARY_API_SECRET: 'test-secret',
              MAX_ATTACHMENT_SIZE_MB: 1,
              RESEND_API_KEY: 'test-resend-key',
              EMAIL_FROM_ADDRESS: 'test@example.com',
              OPENWEATHER_API_KEY: 'test-weather-key',
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

  it('boots AppModule and responds on GET /health', () => {
    return request(app.getHttpServer())
      .get('/health')
      .expect(200)
      .expect((res) => {
        expect(res.body).toEqual({ status: 'ok' });
      });
  });
});