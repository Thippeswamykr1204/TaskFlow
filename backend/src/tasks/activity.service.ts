import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { ActivityLog, ActivityAction } from './schemas/activity-log.schema';

interface ActivityListResult {
  data: ActivityLog[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

@Injectable()
export class ActivityService {
  private readonly logger = new Logger(ActivityService.name);

  constructor(
    @InjectModel(ActivityLog.name) private activityModel: Model<ActivityLog>,
  ) {}

  // Best-effort logging: a failure here should never take down the task
  // create/update/attachment flow that triggered it, so errors are caught
  // and logged rather than propagated — same spirit as MailService.
  async record(
    taskId: string | Types.ObjectId,
    action: ActivityAction,
    meta: Record<string, unknown> = {},
  ): Promise<void> {
    try {
      await this.activityModel.create({ task: taskId, action, meta });
    } catch (err) {
      this.logger.warn(
        `Failed to record activity "${action}" for task ${taskId}: ${(err as Error).message}`,
      );
    }
  }

  // Cascade cleanup: called from TasksService.delete() so activity entries
  // don't outlive the task they belong to. Same best-effort spirit as
  // record() — a logging failure shouldn't be able to block a task delete,
  // but a cleanup failure here is arguably worse to swallow silently, so we
  // still log it loudly via the existing logger rather than throwing.
  async deleteAllForTask(taskId: string): Promise<void> {
    try {
      await this.activityModel.deleteMany({ task: taskId });
    } catch (err) {
      this.logger.warn(
        `Failed to delete activity log entries for task ${taskId}: ${(err as Error).message}`,
      );
    }
  }

  async findForTask(
    taskId: string,
    page = 1,
    limit = 20,
  ): Promise<ActivityListResult> {
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.activityModel
        .find({ task: taskId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.activityModel.countDocuments({ task: taskId }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit) || 1,
      },
    };
  }
}