import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { Task, TaskStatus, Priority } from './schemas/task.schema';
import { AttachmentsService } from './attachments.service';
import { ActivityService } from './activity.service';
import { LocationService } from '../location/location.service';
import { MailService } from '../mail/mail.service';
import { NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let mockTaskModel: any;
  let mockAttachmentsService: Partial<AttachmentsService>;
  let mockActivityService: Partial<ActivityService>;
  let mockLocationService: Partial<LocationService>;
  let mockMailService: Partial<MailService>;

  beforeEach(async () => {
    // Constructable mock: TasksService.create/etc call `new this.taskModel(data)`,
    // so the mock model itself must be a jest.fn() usable as a constructor,
    // with the static query methods attached via Object.assign — matching the
    // pattern used for the Attachment mock model in attachments.service.spec.ts.
    mockTaskModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: 'task1', ...data }),
    }));
    Object.assign(mockTaskModel, {
      create: jest.fn(),
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      findOneAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      aggregate: jest.fn(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    });

    mockAttachmentsService = {
      deleteAllForTask: jest.fn(),
    };

    mockActivityService = {
      record: jest.fn().mockResolvedValue(undefined),
      deleteAllForTask: jest.fn().mockResolvedValue(undefined),
    };

    mockLocationService = {
      resolveLocation: jest.fn(),
    };

    mockMailService = {
      sendTaskCreatedEmail: jest.fn().mockResolvedValue(undefined),
      sendTaskCompletedEmail: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getModelToken(Task.name),
          useValue: mockTaskModel,
        },
        { provide: AttachmentsService, useValue: mockAttachmentsService },
        { provide: ActivityService, useValue: mockActivityService },
        { provide: LocationService, useValue: mockLocationService },
        { provide: MailService, useValue: mockMailService },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task with ownership and send the created email', async () => {
      const userId = 'user123';
      const userEmail = 'user@example.com';
      const dto = { title: 'Test Task', description: 'Test' };
      const mockTask = { _id: 'task1', ...dto, user: userId };

      mockTaskModel.mockImplementation((data: any) => ({
        ...data,
        save: jest.fn().mockResolvedValue(mockTask),
      }));

      const task = await service.create(dto as any, userId, userEmail);

      expect(task.user).toBe(userId);
      expect(mockMailService.sendTaskCreatedEmail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendTaskCreatedEmail).toHaveBeenCalledWith(userEmail, mockTask);
    });
  });

  describe('findAll', () => {
    it('should filter by user at data layer', async () => {
      const userId = 'user123';
      const mockTasks = [{ _id: 'task1', title: 'Task 1', user: userId }];

      mockTaskModel.exec.mockResolvedValue(mockTasks);
      mockTaskModel.countDocuments.mockResolvedValue(1);

      const result = await service.findAll(userId, { page: 1, limit: 10 });

      expect(result.data).toEqual(mockTasks);
      expect(mockTaskModel.find).toHaveBeenCalledWith(expect.objectContaining({ user: userId }));
    });

    it('should filter by status', async () => {
      const userId = 'user123';
      mockTaskModel.exec.mockResolvedValue([]);
      mockTaskModel.countDocuments.mockResolvedValue(0);

      await service.findAll(userId, { status: TaskStatus.TODO, page: 1, limit: 10 });

      expect(mockTaskModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          status: TaskStatus.TODO,
        }),
      );
    });
  });

  describe('update', () => {
    const userId = 'user123';
    const userEmail = 'user@example.com';
    const taskId = 'task1';

    it('sends the completed email on the transition into DONE', async () => {
      const existingTask = {
        _id: taskId,
        title: 'Test Task',
        status: TaskStatus.IN_PROGRESS,
        completedAt: undefined,
      };
      const updatedTask = { ...existingTask, status: TaskStatus.DONE, completedAt: new Date() };

      mockTaskModel.findOne.mockResolvedValue(existingTask);
      mockTaskModel.findOneAndUpdate.mockResolvedValue(updatedTask);

      await service.update(taskId, userId, { status: TaskStatus.DONE }, userEmail);

      expect(mockMailService.sendTaskCompletedEmail).toHaveBeenCalledTimes(1);
      expect(mockMailService.sendTaskCompletedEmail).toHaveBeenCalledWith(userEmail, updatedTask);
    });

    it('does not send the completed email when updating a task that is already DONE', async () => {
      const existingTask = {
        _id: taskId,
        title: 'Test Task',
        status: TaskStatus.DONE,
        completedAt: new Date('2026-01-01'),
      };
      const updatedTask = { ...existingTask, priority: Priority.URGENT };

      mockTaskModel.findOne.mockResolvedValue(existingTask);
      mockTaskModel.findOneAndUpdate.mockResolvedValue(updatedTask);

      await service.update(taskId, userId, { priority: Priority.URGENT }, userEmail);

      expect(mockMailService.sendTaskCompletedEmail).not.toHaveBeenCalled();
    });

    it('does not send the completed email on a non-DONE status transition', async () => {
      const existingTask = {
        _id: taskId,
        title: 'Test Task',
        status: TaskStatus.TODO,
        completedAt: undefined,
      };
      const updatedTask = { ...existingTask, status: TaskStatus.IN_PROGRESS };

      mockTaskModel.findOne.mockResolvedValue(existingTask);
      mockTaskModel.findOneAndUpdate.mockResolvedValue(updatedTask);

      await service.update(taskId, userId, { status: TaskStatus.IN_PROGRESS }, userEmail);

      expect(mockMailService.sendTaskCompletedEmail).not.toHaveBeenCalled();
    });

    it('throws NotFoundException when the task does not exist', async () => {
      mockTaskModel.findOne.mockResolvedValue(null);

      await expect(
        service.update(taskId, userId, { status: TaskStatus.DONE }, userEmail),
      ).rejects.toThrow(NotFoundException);

      expect(mockMailService.sendTaskCompletedEmail).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('cascades attachment cleanup before deleting the task', async () => {
      const userId = 'user123';
      const taskId = 'task1';
      mockTaskModel.findOne.mockResolvedValue({ _id: taskId, user: userId });
      mockTaskModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await service.delete(taskId, userId);

      expect(mockAttachmentsService.deleteAllForTask).toHaveBeenCalledWith(taskId);
      expect(mockTaskModel.deleteOne).toHaveBeenCalledWith({ _id: taskId, user: userId });
    });
  });
});