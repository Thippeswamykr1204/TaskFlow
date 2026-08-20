import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Attachment } from './schemas/attachment.schema';
import { Task } from './schemas/task.schema';
import { CloudinaryService } from '../uploads/cloudinary.service';
import { resourceTypeForMime } from '../uploads/attachment-validation.pipe';
import { ActivityService } from './activity.service';
import { ActivityAction } from './schemas/activity-log.schema';

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectModel(Attachment.name) private attachmentModel: Model<Attachment>,
    @InjectModel(Task.name) private taskModel: Model<Task>,
    private cloudinaryService: CloudinaryService,
    private activityService: ActivityService,
  ) {}

  private async assertTaskOwnership(taskId: string, userId: string): Promise<void> {
    const task = await this.taskModel.findOne({ _id: taskId, user: userId });
    if (!task) {
      throw new NotFoundException({
        error: 'TASK_NOT_FOUND',
        message: 'Task not found',
      });
    }
  }

  async create(
    taskId: string,
    userId: string,
    file: Express.Multer.File,
  ): Promise<Attachment> {
    await this.assertTaskOwnership(taskId, userId);

    const resourceType = resourceTypeForMime(file.mimetype);

    // Should be unreachable — AttachmentValidationPipe already rejects
    // unsupported mime types — but guards against a mismatched allowlist.
    if (!resourceType) {
      throw new NotFoundException({
        error: 'UNSUPPORTED_FILE_TYPE',
        message: `File type "${file.mimetype}" is not allowed`,
      });
    }

    const uploadResult = await this.cloudinaryService.upload(file.buffer, {
      resourceType,
    });

    const attachment = new this.attachmentModel({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      fileName: file.originalname,
      fileType: file.mimetype,
      fileSize: file.size,
      resourceType: uploadResult.resourceType,
      task: taskId,
    });

    const saved = await attachment.save();
    await this.activityService.record(taskId, ActivityAction.ATTACHMENT_ADDED, {
      fileName: saved.fileName,
    });

    return saved;
  }

  async delete(taskId: string, userId: string, attachmentId: string): Promise<void> {
    await this.assertTaskOwnership(taskId, userId);

    const attachment = await this.attachmentModel.findOne({
      _id: attachmentId,
      task: taskId,
    });

    if (!attachment) {
      throw new NotFoundException({
        error: 'ATTACHMENT_NOT_FOUND',
        message: 'Attachment not found',
      });
    }

    // If Cloudinary cleanup fails, surface the error rather than deleting
    // the DB record and leaving an orphaned asset in Cloudinary.
    await this.cloudinaryService.destroy(attachment.publicId, attachment.resourceType);

    await this.attachmentModel.deleteOne({ _id: attachmentId });
    await this.activityService.record(taskId, ActivityAction.ATTACHMENT_REMOVED, {
      fileName: attachment.fileName,
    });
  }

  /**
   * Used by TasksService.delete to cascade-clean attachments when a task
   * is removed. Failures per-attachment are logged, not thrown, so the
   * task delete itself still succeeds even if Cloudinary cleanup partially
   * fails.
   */
  async deleteAllForTask(taskId: string): Promise<void> {
    const attachments = await this.attachmentModel.find({ task: taskId });

    for (const attachment of attachments) {
      try {
        await this.cloudinaryService.destroy(attachment.publicId, attachment.resourceType);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(
          `Failed to destroy Cloudinary asset ${attachment.publicId} for task ${taskId}:`,
          err,
        );
      }
    }

    await this.attachmentModel.deleteMany({ task: taskId });
  }
}