import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { CloudinaryService } from '../src/uploads/cloudinary.service';

describe('Attachments (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let userAToken: string;
  let userBToken: string;
  let taskAId: string;

  const mockCloudinaryService = {
    upload: jest.fn(),
    destroy: jest.fn(),
  };

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
            }),
          ],
        }),
        AppModule,
      ],
    })
      .overrideProvider(CloudinaryService)
      .useValue(mockCloudinaryService)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();

    const userARegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'User A',
        email: 'attacha@example.com',
        password: 'SecurePass123!',
      });
    userAToken = userARegister.body.accessToken;

    const userBRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'User B',
        email: 'attachb@example.com',
        password: 'SecurePass123!',
      });
    userBToken = userBRegister.body.accessToken;

    const taskRes = await request(app.getHttpServer())
      .post('/tasks')
      .set('Authorization', `Bearer ${userAToken}`)
      .send({ title: 'Task with attachments' });
    taskAId = taskRes.body.data._id;
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /tasks/:id/attachments', () => {
    it('uploads a valid file successfully', async () => {
      mockCloudinaryService.upload.mockResolvedValue({
        url: 'https://res.cloudinary.com/test/image/upload/abc.png',
        publicId: 'abc',
        resourceType: 'image',
      });

      const res = await request(app.getHttpServer())
        .post(`/tasks/${taskAId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', Buffer.from('fake-image-bytes'), {
          filename: 'photo.png',
          contentType: 'image/png',
        })
        .expect(201);

      expect(res.body.data.publicId).toBe('abc');
      expect(res.body.data.resourceType).toBe('image');
      expect(res.body.data.task).toBe(taskAId);
    });

    it('rejects an oversized file before calling Cloudinary', async () => {
      const oversized = Buffer.alloc(2 * 1024 * 1024); // 2MB > 1MB test limit

      await request(app.getHttpServer())
        .post(`/tasks/${taskAId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', oversized, {
          filename: 'big.png',
          contentType: 'image/png',
        })
        .expect(400);

      expect(mockCloudinaryService.upload).not.toHaveBeenCalled();
    });

    it('rejects a disallowed MIME type before calling Cloudinary', async () => {
      await request(app.getHttpServer())
        .post(`/tasks/${taskAId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', Buffer.from('#!/bin/sh'), {
          filename: 'script.sh',
          contentType: 'application/x-sh',
        })
        .expect(400);

      expect(mockCloudinaryService.upload).not.toHaveBeenCalled();
    });

    it('returns 404 when User B uploads to User A task', async () => {
      await request(app.getHttpServer())
        .post(`/tasks/${taskAId}/attachments`)
        .set('Authorization', `Bearer ${userBToken}`)
        .attach('file', Buffer.from('fake-image-bytes'), {
          filename: 'photo.png',
          contentType: 'image/png',
        })
        .expect(404);
    });
  });

  describe('DELETE /tasks/:id/attachments/:attachmentId', () => {
    it('deletes an attachment, calling Cloudinary destroy', async () => {
      mockCloudinaryService.upload.mockResolvedValue({
        url: 'https://res.cloudinary.com/test/image/upload/xyz.png',
        publicId: 'xyz',
        resourceType: 'image',
      });

      const uploadRes = await request(app.getHttpServer())
        .post(`/tasks/${taskAId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', Buffer.from('fake-image-bytes'), {
          filename: 'photo.png',
          contentType: 'image/png',
        });
      const attachmentId = uploadRes.body.data._id;

      mockCloudinaryService.destroy.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/tasks/${taskAId}/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(204);

      expect(mockCloudinaryService.destroy).toHaveBeenCalledWith('xyz', 'image');
    });

    it('returns 404 when User B deletes from User A task', async () => {
      mockCloudinaryService.upload.mockResolvedValue({
        url: 'https://res.cloudinary.com/test/image/upload/qrs.png',
        publicId: 'qrs',
        resourceType: 'image',
      });

      const uploadRes = await request(app.getHttpServer())
        .post(`/tasks/${taskAId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', Buffer.from('fake-image-bytes'), {
          filename: 'photo.png',
          contentType: 'image/png',
        });
      const attachmentId = uploadRes.body.data._id;

      await request(app.getHttpServer())
        .delete(`/tasks/${taskAId}/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(404);
    });

    it('returns 404 ATTACHMENT_NOT_FOUND for an unknown attachment id on own task', async () => {
      const res = await request(app.getHttpServer())
        .delete(`/tasks/${taskAId}/attachments/507f1f77bcf86cd799439011`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404);

      expect(res.body.error).toBe('ATTACHMENT_NOT_FOUND');
    });
  });

  describe('Task deletion cascade', () => {
    it('deletes all attachment DB records when the task is deleted', async () => {
      const taskRes = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ title: 'Task to be deleted' });
      const cascadeTaskId = taskRes.body.data._id;

      mockCloudinaryService.upload.mockResolvedValue({
        url: 'https://res.cloudinary.com/test/image/upload/cascade.png',
        publicId: 'cascade',
        resourceType: 'image',
      });

      const uploadRes = await request(app.getHttpServer())
        .post(`/tasks/${cascadeTaskId}/attachments`)
        .set('Authorization', `Bearer ${userAToken}`)
        .attach('file', Buffer.from('fake-image-bytes'), {
          filename: 'photo.png',
          contentType: 'image/png',
        });
      const attachmentId = uploadRes.body.data._id;

      mockCloudinaryService.destroy.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/tasks/${cascadeTaskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(204);

      expect(mockCloudinaryService.destroy).toHaveBeenCalledWith('cascade', 'image');

      // Attempting to delete the (now-gone) attachment on the (now-gone)
      // task should 404 — confirms the Attachment doc no longer exists.
      await request(app.getHttpServer())
        .delete(`/tasks/${cascadeTaskId}/attachments/${attachmentId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404);
    });
  });
});