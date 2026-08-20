import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '../src/app.module';
import { TaskStatus, Priority } from '../src/tasks/schemas/task.schema';

describe('Tasks (e2e)', () => {
  let app: INestApplication;
  let mongoServer: MongoMemoryServer;
  let userAToken: string;
  let userBToken: string;
  let userAId: string;
  let userBId: string;
  let taskId: string;

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

    // Register and login as User A
    const userARegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'User A',
        email: 'usera@example.com',
        password: 'SecurePass123!',
      });
    userAId = userARegister.body.user._id;
    userAToken = userARegister.body.accessToken;

    // Register and login as User B
    const userBRegister = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        name: 'User B',
        email: 'userb@example.com',
        password: 'SecurePass123!',
      });
    userBId = userBRegister.body.user._id;
    userBToken = userBRegister.body.accessToken;
  });

  afterAll(async () => {
    await app.close();
    await mongoServer.stop();
  });

  describe('POST /tasks', () => {
    it('should create a task', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'My Task',
          description: 'A test task',
          priority: Priority.HIGH,
        })
        .expect(201);

      expect(res.body.data).toBeDefined();
      expect(res.body.data.title).toBe('My Task');
      expect(res.body.data.priority).toBe(Priority.HIGH);
      expect(res.body.data.status).toBe(TaskStatus.BACKLOG);
      taskId = res.body.data._id;
    });

    it('should reject invalid title', async () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: '',
          description: 'A test task',
        })
        .expect(400);
    });

    it('should reject missing required fields', async () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          description: 'No title',
        })
        .expect(400);
    });

    it('should reject without auth', async () => {
      return request(app.getHttpServer())
        .post('/tasks')
        .send({
          title: 'Unauthorized Task',
        })
        .expect(401);
    });
  });

  describe('GET /tasks/:id', () => {
    it('should get a task owned by user', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data._id).toBe(taskId);
      expect(res.body.data.title).toBe('My Task');
    });

    it('should return 404 for non-existent task', async () => {
      return request(app.getHttpServer())
        .get('/tasks/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('TASK_NOT_FOUND');
        });
    });

    it('should return 404 when User B accesses User A task (ownership test)', async () => {
      return request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('TASK_NOT_FOUND');
        });
    });

    it('should reject without auth', async () => {
      return request(app.getHttpServer())
        .get(`/tasks/${taskId}`)
        .expect(401);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update a task owned by user', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Updated Task',
          status: TaskStatus.IN_PROGRESS,
        })
        .expect(200);

      expect(res.body.data.title).toBe('Updated Task');
      expect(res.body.data.status).toBe(TaskStatus.IN_PROGRESS);
    });

    it('should set completedAt when marking DONE', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          status: TaskStatus.DONE,
        })
        .expect(200);

      expect(res.body.data.status).toBe(TaskStatus.DONE);
      expect(res.body.data.completedAt).toBeDefined();
    });

    it('should clear completedAt when unmarking DONE', async () => {
      const res = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          status: TaskStatus.TODO,
        })
        .expect(200);

      expect(res.body.data.status).toBe(TaskStatus.TODO);
      expect(res.body.data.completedAt).toBeUndefined();
    });

    it('should return 404 when User B updates User A task (ownership test)', async () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .send({
          title: 'Hacked!',
        })
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('TASK_NOT_FOUND');
        });
    });

    it('should reject without auth', async () => {
      return request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .send({
          title: 'Unauthorized',
        })
        .expect(401);
    });
  });

  describe('DELETE /tasks/:id', () => {
    let deleteTaskId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Task to Delete',
        });
      deleteTaskId = res.body.data._id;
    });

    it('should delete a task owned by user', async () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${deleteTaskId}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(204);
    });

    it('should return 404 for non-existent task', async () => {
      return request(app.getHttpServer())
        .delete('/tasks/507f1f77bcf86cd799439011')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('TASK_NOT_FOUND');
        });
    });

    it('should return 404 when User B deletes User A task (ownership test)', async () => {
      const res = await request(app.getHttpServer())
        .post('/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          title: 'Another Task',
        });
      const anotherTaskId = res.body.data._id;

      return request(app.getHttpServer())
        .delete(`/tasks/${anotherTaskId}`)
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(404)
        .expect((res) => {
          expect(res.body.error).toBe('TASK_NOT_FOUND');
        });
    });

    it('should reject without auth', async () => {
      return request(app.getHttpServer())
        .delete(`/tasks/${taskId}`)
        .expect(401);
    });
  });

  describe('GET /tasks', () => {
    let taskIds: string[] = [];

    beforeAll(async () => {
      // Create multiple tasks for filtering
      for (let i = 0; i < 5; i++) {
        const res = await request(app.getHttpServer())
          .post('/tasks')
          .set('Authorization', `Bearer ${userAToken}`)
          .send({
            title: `Task ${i}`,
            priority: i % 2 === 0 ? Priority.HIGH : Priority.LOW,
            status: i < 2 ? TaskStatus.TODO : TaskStatus.BACKLOG,
            tags: i % 2 === 0 ? ['urgent', 'work'] : ['personal'],
          });
        taskIds.push(res.body.data._id);
      }
    });

    it('should list all tasks for user', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data).toBeDefined();
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.total).toBeGreaterThan(0);
    });

    it('should filter by status', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks?status=${TaskStatus.TODO}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.every((t: any) => t.status === TaskStatus.TODO)).toBe(true);
    });

    it('should filter by priority', async () => {
      const res = await request(app.getHttpServer())
        .get(`/tasks?priority=${Priority.HIGH}`)
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.every((t: any) => t.priority === Priority.HIGH)).toBe(true);
    });

    it('should search by title', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks?search=Task%202')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.some((t: any) => t.title.includes('Task 2'))).toBe(true);
    });

    it('should filter by tags', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks?tags=urgent')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res.body.data.every((t: any) => t.tags.includes('urgent'))).toBe(true);
    });

    it('should handle pagination', async () => {
      const res1 = await request(app.getHttpServer())
        .get('/tasks?page=1&limit=2')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res1.body.data.length).toBeLessThanOrEqual(2);
      expect(res1.body.meta.page).toBe(1);

      const res2 = await request(app.getHttpServer())
        .get('/tasks?page=2&limit=2')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(200);

      expect(res2.body.meta.page).toBe(2);
    });

    it('should reject limit > 50', async () => {
      return request(app.getHttpServer())
        .get('/tasks?limit=100')
        .set('Authorization', `Bearer ${userAToken}`)
        .expect(400);
    });

    it('should only show tasks owned by user', async () => {
      const res = await request(app.getHttpServer())
        .get('/tasks')
        .set('Authorization', `Bearer ${userBToken}`)
        .expect(200);

      // User B should not see User A's tasks
      expect(res.body.data.every((t: any) => t.user === userBId)).toBe(true);
    });

    it('should reject without auth', async () => {
      return request(app.getHttpServer())
        .get('/tasks')
        .expect(401);
    });
  });
});