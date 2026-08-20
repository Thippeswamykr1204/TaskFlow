import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { TasksService } from './tasks.service';
import { Task, TaskStatus, Priority } from './schemas/task.schema';
import { NotFoundException } from '@nestjs/common';

describe('TasksService', () => {
  let service: TasksService;
  let mockTaskModel: any;

  beforeEach(async () => {
    mockTaskModel = {
      create: jest.fn(),
      find: jest.fn().mockReturnThis(),
      findOne: jest.fn(),
      findByIdAndUpdate: jest.fn(),
      deleteOne: jest.fn(),
      countDocuments: jest.fn(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TasksService,
        {
          provide: getModelToken(Task.name),
          useValue: mockTaskModel,
        },
      ],
    }).compile();

    service = module.get<TasksService>(TasksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a task with ownership', async () => {
      const userId = 'user123';
      const dto = { title: 'Test Task', description: 'Test' };
      const mockTask = { _id: 'task1', ...dto, user: userId };

      mockTaskModel.prototype.save = jest.fn().mockResolvedValue(mockTask);
      jest.spyOn(mockTaskModel, 'create').mockImplementation(() => mockTask);

      const task = await service.create(dto, userId);
      expect(task.user).toBe(userId);
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

    it('should filter by priority', async () => {
      const userId = 'user123';
      mockTaskModel.exec.mockResolvedValue([]);
      mockTaskModel.countDocuments.mockResolvedValue(0);

      await service.findAll(userId, { priority: Priority.HIGH, page: 1, limit: 10 });

      expect(mockTaskModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          priority: Priority.HIGH,
        }),
      );
    });

    it('should filter by search (case-insensitive)', async () => {
      const userId = 'user123';
      mockTaskModel.exec.mockResolvedValue([]);
      mockTaskModel.countDocuments.mockResolvedValue(0);

      await service.findAll(userId, { search: 'test', page: 1, limit: 10 });

      expect(mockTaskModel.find).toHaveBeenCalledWith(
        expect.objectContaining({
          user: userId,
          $or: expect.arrayContaining([
            expect.objectContaining({ title: expect.any(Object) }),
            expect.objectContaining({ description: expect.any(Object) }),
          ]),
        }),
      );
    });

    it('should handle pagination', async () => {
      const userId = 'user123';
      mockTaskModel.exec.mockResolvedValue([]);
      mockTaskModel.countDocuments.mockResolvedValue(25);

      const result = await service.findAll(userId, { page: 2, limit: 10 });

      expect(mockTaskModel.skip).toHaveBeenCalledWith(10);
      expect(mockTaskModel.limit).toHaveBeenCalledWith(10);
      expect(result.meta.page).toBe(2);
      expect(result.meta.lastPage).toBe(3);
    });
  });

  describe('findOne', () => {
    it('should return a task if owned by user', async () => {
      const userId = 'user123';
      const taskId = 'task1';
      const mockTask = { _id: taskId, title: 'Task 1', user: userId };

      mockTaskModel.findOne.mockResolvedValue(mockTask);

      const result = await service.findOne(taskId, userId);
      expect(result).toEqual(mockTask);
      expect(mockTaskModel.findOne).toHaveBeenCalledWith({
        _id: taskId,
        user: userId,
      });
    });

    it('should throw 404 if task not found', async () => {
      mockTaskModel.findOne.mockResolvedValue(null);

      await expect(service.findOne('task1', 'user123')).rejects.toThrow(NotFoundException);
    });

    it('should throw 404 if task owned by different user', async () => {
      mockTaskModel.findOne.mockResolvedValue(null);

      await expect(service.findOne('task1', 'otherUser')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a task if owned by user', async () => {
      const userId = 'user123';
      const taskId = 'task1';
      const mockTask = { _id: taskId, title: 'Task 1', status: TaskStatus.BACKLOG, user: userId };
      const updated = { ...mockTask, title: 'Updated' };

      mockTaskModel.findOne.mockResolvedValue(mockTask);
      mockTaskModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.update(taskId, userId, { title: 'Updated' });
      expect(result.title).toBe('Updated');
    });

    it('should set completedAt when status changes to DONE', async () => {
      const userId = 'user123';
      const taskId = 'task1';
      const mockTask = { _id: taskId, status: TaskStatus.TODO, completedAt: null, user: userId };
      const updated = { ...mockTask, status: TaskStatus.DONE, completedAt: new Date() };

      mockTaskModel.findOne.mockResolvedValue(mockTask);
      mockTaskModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.update(taskId, userId, { status: TaskStatus.DONE });
      expect(result.status).toBe(TaskStatus.DONE);
    });

    it('should clear completedAt when status changes away from DONE', async () => {
      const userId = 'user123';
      const taskId = 'task1';
      const mockTask = { _id: taskId, status: TaskStatus.DONE, completedAt: new Date(), user: userId };
      const updated = { ...mockTask, status: TaskStatus.TODO, completedAt: undefined };

      mockTaskModel.findOne.mockResolvedValue(mockTask);
      mockTaskModel.findByIdAndUpdate.mockResolvedValue(updated);

      const result = await service.update(taskId, userId, { status: TaskStatus.TODO });
      expect(result.completedAt).toBeUndefined();
    });

    it('should throw 404 if task not found', async () => {
      mockTaskModel.findOne.mockResolvedValue(null);

      await expect(service.update('task1', 'user123', {})).rejects.toThrow(NotFoundException);
    });

    it('should throw 404 if task owned by different user', async () => {
      mockTaskModel.findOne.mockResolvedValue(null);

      await expect(service.update('task1', 'otherUser', {})).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete a task if owned by user', async () => {
      const userId = 'user123';
      const taskId = 'task1';

      mockTaskModel.deleteOne.mockResolvedValue({ deletedCount: 1 });

      await service.delete(taskId, userId);

      expect(mockTaskModel.deleteOne).toHaveBeenCalledWith({
        _id: taskId,
        user: userId,
      });
    });

    it('should throw 404 if task not found', async () => {
      mockTaskModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(service.delete('task1', 'user123')).rejects.toThrow(NotFoundException);
    });

    it('should throw 404 if task owned by different user', async () => {
      mockTaskModel.deleteOne.mockResolvedValue({ deletedCount: 0 });

      await expect(service.delete('task1', 'otherUser')).rejects.toThrow(NotFoundException);
    });
  });
});