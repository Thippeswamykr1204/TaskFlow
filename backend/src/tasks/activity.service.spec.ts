import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ActivityService } from './activity.service';
import { ActivityLog, ActivityAction } from './schemas/activity-log.schema';

describe('ActivityService', () => {
  let service: ActivityService;
  let mockActivityModel: any;

  beforeEach(async () => {
    mockActivityModel = {
      create: jest.fn(),
      deleteMany: jest.fn(),
      find: jest.fn().mockReturnThis(),
      sort: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      exec: jest.fn(),
      countDocuments: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ActivityService,
        {
          provide: getModelToken(ActivityLog.name),
          useValue: mockActivityModel,
        },
      ],
    }).compile();

    service = module.get<ActivityService>(ActivityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('record', () => {
    it('creates an entry with the correct action and meta', async () => {
      mockActivityModel.create.mockResolvedValue({
        task: 'task1',
        action: ActivityAction.STATUS_CHANGED,
        meta: { from: 'TODO', to: 'DONE' },
      });

      await service.record('task1', ActivityAction.STATUS_CHANGED, {
        from: 'TODO',
        to: 'DONE',
      });

      expect(mockActivityModel.create).toHaveBeenCalledWith({
        task: 'task1',
        action: ActivityAction.STATUS_CHANGED,
        meta: { from: 'TODO', to: 'DONE' },
      });
    });

    it('defaults meta to an empty object when not provided', async () => {
      mockActivityModel.create.mockResolvedValue({});

      await service.record('task1', ActivityAction.CREATED);

      expect(mockActivityModel.create).toHaveBeenCalledWith({
        task: 'task1',
        action: ActivityAction.CREATED,
        meta: {},
      });
    });

    it('catches and logs a failure instead of throwing', async () => {
      mockActivityModel.create.mockRejectedValue(new Error('db down'));
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => undefined);

      await expect(
        service.record('task1', ActivityAction.CREATED),
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('deleteAllForTask', () => {
    it('removes all entries for the given task', async () => {
      mockActivityModel.deleteMany.mockResolvedValue({ deletedCount: 3 });

      await service.deleteAllForTask('task1');

      expect(mockActivityModel.deleteMany).toHaveBeenCalledWith({
        task: 'task1',
      });
    });

    it('catches and logs a deleteMany failure instead of throwing', async () => {
      mockActivityModel.deleteMany.mockRejectedValue(new Error('db down'));
      const warnSpy = jest
        .spyOn((service as any).logger, 'warn')
        .mockImplementation(() => undefined);

      await expect(
        service.deleteAllForTask('task1'),
      ).resolves.toBeUndefined();

      expect(warnSpy).toHaveBeenCalled();

      warnSpy.mockRestore();
    });
  });

  describe('findForTask', () => {
    it('returns paginated data and meta', async () => {
      const entries = [
        { task: 'task1', action: ActivityAction.CREATED },
        { task: 'task1', action: ActivityAction.STATUS_CHANGED },
      ];
      mockActivityModel.exec.mockResolvedValue(entries);
      mockActivityModel.countDocuments.mockResolvedValue(2);

      const result = await service.findForTask('task1', 1, 20);

      expect(mockActivityModel.find).toHaveBeenCalledWith({ task: 'task1' });
      expect(result.data).toEqual(entries);
      expect(result.meta).toEqual({ total: 2, page: 1, lastPage: 1 });
    });
  });
});