import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { NotFoundException } from '@nestjs/common';
import { AttachmentsService } from './attachments.service';
import { Attachment } from './schemas/attachment.schema';
import { Task } from './schemas/task.schema';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { ActivityService } from './activity.service';

describe('AttachmentsService', () => {
  let service: AttachmentsService;
  let mockAttachmentModel: any;
  let mockTaskModel: any;
  let mockCloudinaryService: Partial<CloudinaryService>;
  let mockActivityService: Partial<ActivityService>;

  beforeEach(async () => {
    mockAttachmentModel = jest.fn().mockImplementation((data) => ({
      ...data,
      save: jest.fn().mockResolvedValue({ _id: 'attach1', ...data }),
    }));
    mockAttachmentModel.findOne = jest.fn();
    mockAttachmentModel.find = jest.fn();
    mockAttachmentModel.deleteOne = jest.fn();
    mockAttachmentModel.deleteMany = jest.fn();

    mockTaskModel = {
      findOne: jest.fn(),
    };

    mockCloudinaryService = {
      upload: jest.fn(),
      destroy: jest.fn(),
    };

    mockActivityService = {
      record: jest.fn().mockResolvedValue(undefined),
      deleteAllForTask: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttachmentsService,
        { provide: getModelToken(Attachment.name), useValue: mockAttachmentModel },
        { provide: getModelToken(Task.name), useValue: mockTaskModel },
        { provide: CloudinaryService, useValue: mockCloudinaryService },
        { provide: ActivityService, useValue: mockActivityService },
      ],
    }).compile();

    service = module.get<AttachmentsService>(AttachmentsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('throws TASK_NOT_FOUND when task does not belong to user', async () => {
      mockTaskModel.findOne.mockResolvedValue(null);

      await expect(
        service.create('task1', 'user1', {
          mimetype: 'image/png',
          buffer: Buffer.from('x'),
          originalname: 'a.png',
          size: 100,
        } as Express.Multer.File),
      ).rejects.toThrow(NotFoundException);

      expect(mockCloudinaryService.upload).not.toHaveBeenCalled();
    });

    it('uploads to Cloudinary and saves an Attachment on success', async () => {
      mockTaskModel.findOne.mockResolvedValue({ _id: 'task1', user: 'user1' });
      (mockCloudinaryService.upload as jest.Mock).mockResolvedValue({
        url: 'https://res.cloudinary.com/test/image/upload/abc.png',
        publicId: 'abc',
        resourceType: 'image',
      });

      const file = {
        mimetype: 'image/png',
        buffer: Buffer.from('x'),
        originalname: 'a.png',
        size: 100,
      } as Express.Multer.File;

      const result = await service.create('task1', 'user1', file);

      expect(mockCloudinaryService.upload).toHaveBeenCalledWith(file.buffer, {
        resourceType: 'image',
      });
      expect(result.publicId).toBe('abc');
      expect(result.task).toBe('task1');
    });
  });

  describe('delete', () => {
    it('throws ATTACHMENT_NOT_FOUND when attachment does not belong to task', async () => {
      mockTaskModel.findOne.mockResolvedValue({ _id: 'task1', user: 'user1' });
      mockAttachmentModel.findOne.mockResolvedValue(null);

      await expect(service.delete('task1', 'user1', 'attach1')).rejects.toThrow(
        NotFoundException,
      );
      expect(mockCloudinaryService.destroy).not.toHaveBeenCalled();
    });

    it('destroys Cloudinary asset then deletes the DB record', async () => {
      mockTaskModel.findOne.mockResolvedValue({ _id: 'task1', user: 'user1' });
      mockAttachmentModel.findOne.mockResolvedValue({
        _id: 'attach1',
        publicId: 'abc',
        resourceType: 'image',
        task: 'task1',
      });
      (mockCloudinaryService.destroy as jest.Mock).mockResolvedValue(undefined);

      await service.delete('task1', 'user1', 'attach1');

      expect(mockCloudinaryService.destroy).toHaveBeenCalledWith('abc', 'image');
      expect(mockAttachmentModel.deleteOne).toHaveBeenCalledWith({ _id: 'attach1' });
    });

    it('does not delete the DB record if Cloudinary destroy fails', async () => {
      mockTaskModel.findOne.mockResolvedValue({ _id: 'task1', user: 'user1' });
      mockAttachmentModel.findOne.mockResolvedValue({
        _id: 'attach1',
        publicId: 'abc',
        resourceType: 'image',
        task: 'task1',
      });
      (mockCloudinaryService.destroy as jest.Mock).mockRejectedValue(new Error('cloudinary down'));

      await expect(service.delete('task1', 'user1', 'attach1')).rejects.toThrow();
      expect(mockAttachmentModel.deleteOne).not.toHaveBeenCalled();
    });
  });

  describe('deleteAllForTask', () => {
    it('destroys each attachment in Cloudinary and logs failures without throwing', async () => {
      const attachments = [
        { publicId: 'a', resourceType: 'image' },
        { publicId: 'b', resourceType: 'raw' },
      ];
      mockAttachmentModel.find.mockResolvedValue(attachments);
      (mockCloudinaryService.destroy as jest.Mock)
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('cloudinary down'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);

      await service.deleteAllForTask('task1');

      expect(mockCloudinaryService.destroy).toHaveBeenCalledTimes(2);
      expect(mockAttachmentModel.deleteMany).toHaveBeenCalledWith({ task: 'task1' });
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });
});