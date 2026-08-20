import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskStatus, Priority } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';
import { AttachmentsService } from './attachments.service';
import { MailService } from '../mail/mail.service';
import { LocationService } from '../location/location.service';

interface TasksResponse {
  success: boolean;
  data: Task[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

interface TaskStats {
  total: number;
  byStatus: Record<TaskStatus, number>;
  byPriority: Record<Priority, number>;
  overdue: number;
  completedThisWeek: number;
  completionRate: number;
}

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    private attachmentsService: AttachmentsService,
    private mailService: MailService,
    private locationService: LocationService,
  ) {}

  async create(dto: CreateTaskDto, userId: string, userEmail: string): Promise<Task> {
    const taskData: any = {
      ...dto,
      user: userId,
    };

    if (dto.dueDate) {
      taskData.dueDate = new Date(dto.dueDate);
    }

    // Resolve city to lat/lng if city is provided but lat/lng are not
    if (
      dto.location?.city &&
      (!dto.location.lat || !dto.location.lng)
    ) {
      const resolved = await this.locationService.resolveLocation(
        dto.location.city,
      );
      if (resolved) {
        taskData.location.lat = resolved.lat;
        taskData.location.lng = resolved.lng;
      }
      // If resolution fails, still save task with just the city string
    }

    const task = new this.taskModel(taskData);
    const saved = await task.save();

    // Fire-and-forget from the caller's perspective: MailService swallows
    // its own errors and has an internal timeout, so this can't fail or
    // hang the create request — it's still awaited so a slow email
    // provider can't leave a dangling unhandled promise, but it never
    // throws back up to here.
    await this.mailService.sendTaskCreatedEmail(userEmail, saved);

    return saved;
  }

  async findAll(userId: string, query: QueryTasksDto): Promise<TasksResponse> {
    const page = query.page || 1;
    const limit = query.limit || 10;
    const skip = (page - 1) * limit;

    const filter: any = {
      user: userId,
    };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    if (query.tags) {
      const tagArray = query.tags.split(',').map((t) => t.trim());
      filter.tags = { $in: tagArray };
    }

    if (query.startDate || query.endDate) {
      filter.dueDate = {};
      if (query.startDate) {
        filter.dueDate.$gte = new Date(query.startDate);
      }
      if (query.endDate) {
        filter.dueDate.$lte = new Date(query.endDate);
      }
    }

    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sortObj: any = {};
    sortObj[sortBy] = sortOrder;

    const [data, total] = await Promise.all([
      this.taskModel
        .find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.taskModel.countDocuments(filter),
    ]);

    const lastPage = Math.ceil(total / limit);

    return {
      success: true,
      data,
      meta: {
        total,
        page,
        lastPage,
      },
    };
  }

  async findOne(id: string, userId: string): Promise<Task> {
    const task = await this.taskModel.findOne({
      _id: id,
      user: userId,
    });

    if (!task) {
      throw new NotFoundException({
        error: 'TASK_NOT_FOUND',
        message: 'Task not found',
      });
    }

    return task;
  }

  async update(
    id: string,
    userId: string,
    dto: UpdateTaskDto,
    userEmail: string,
  ): Promise<Task> {
    // Verify ownership at data layer
    const task = await this.taskModel.findOne({
      _id: id,
      user: userId,
    });

    if (!task) {
      throw new NotFoundException({
        error: 'TASK_NOT_FOUND',
        message: 'Task not found',
      });
    }

    const setData: any = { ...dto };
    let shouldUnsetCompletedAt = false;
    let shouldSetCompletedAt = false;

    // Handle completedAt based on status transition
    if (dto.status !== undefined) {
      if (dto.status === TaskStatus.DONE && !task.completedAt) {
        setData.completedAt = new Date();
        shouldSetCompletedAt = true;
      } else if (dto.status !== TaskStatus.DONE && task.completedAt) {
        delete setData.completedAt;
        shouldUnsetCompletedAt = true;
      }
    }

    if (dto.dueDate) {
      setData.dueDate = new Date(dto.dueDate);
    }

    // Resolve city to lat/lng if location.city changed and lat/lng not provided
    if (
      dto.location?.city &&
      (!dto.location.lat || !dto.location.lng)
    ) {
      const resolved = await this.locationService.resolveLocation(
        dto.location.city,
      );
      if (resolved) {
        setData.location = setData.location || {};
        setData.location.lat = resolved.lat;
        setData.location.lng = resolved.lng;
      }
      // If resolution fails, still update with just the city string
    }

    const updateQuery: any = shouldUnsetCompletedAt
      ? { $set: setData, $unset: { completedAt: '' } }
      : { $set: setData };

    const updated = await this.taskModel.findOneAndUpdate(
      { _id: id, user: userId },
      updateQuery,
      { new: true },
    );

    if (!updated) {
      throw new NotFoundException({
        error: 'TASK_NOT_FOUND',
        message: 'Task not found',
      });
    }

    // Only fires on the BACKLOG/TODO/IN_PROGRESS -> DONE transition, never
    // on a subsequent update to a task that's already DONE.
    if (shouldSetCompletedAt) {
      await this.mailService.sendTaskCompletedEmail(userEmail, updated);
    }

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const task = await this.taskModel.findOne({
      _id: id,
      user: userId,
    });

    if (!task) {
      throw new NotFoundException({
        error: 'TASK_NOT_FOUND',
        message: 'Task not found',
      });
    }

    // Cascade-clean attachments (Cloudinary assets + DB records) before
    // removing the task itself. Per-attachment failures are logged inside
    // AttachmentsService rather than thrown, so this never blocks the
    // task delete.
    await this.attachmentsService.deleteAllForTask(id);

    await this.taskModel.deleteOne({
      _id: id,
      user: userId,
    });
  }

  async getStats(userId: string): Promise<TaskStats> {
    const { Types } = await import('mongoose');
    const userObjectId = new Types.ObjectId(userId);
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const statuses = Object.values(TaskStatus);
    const priorities = Object.values(Priority);

    const [result] = await this.taskModel.aggregate([
      { $match: { user: userObjectId } },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: [
            { $group: { _id: '$status', count: { $sum: 1 } } },
          ],
          byPriority: [
            { $group: { _id: '$priority', count: { $sum: 1 } } },
          ],
          overdue: [
            {
              $match: {
                dueDate: { $lt: now },
                status: { $ne: TaskStatus.DONE },
              },
            },
            { $count: 'count' },
          ],
          completedThisWeek: [
            {
              $match: {
                completedAt: { $gte: sevenDaysAgo, $lte: now },
              },
            },
            { $count: 'count' },
          ],
          doneCount: [
            { $match: { status: TaskStatus.DONE } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    const total = result.total[0]?.count || 0;
    const doneCount = result.doneCount[0]?.count || 0;

    const byStatus = statuses.reduce((acc, status) => {
      acc[status] = 0;
      return acc;
    }, {} as Record<TaskStatus, number>);
    for (const entry of result.byStatus) {
      byStatus[entry._id as TaskStatus] = entry.count;
    }

    const byPriority = priorities.reduce((acc, priority) => {
      acc[priority] = 0;
      return acc;
    }, {} as Record<Priority, number>);
    for (const entry of result.byPriority) {
      byPriority[entry._id as Priority] = entry.count;
    }

    const completionRate =
      total === 0 ? 0 : Math.round((doneCount / total) * 100) / 100;

    return {
      total,
      byStatus,
      byPriority,
      overdue: result.overdue[0]?.count || 0,
      completedThisWeek: result.completedThisWeek[0]?.count || 0,
      completionRate,
    };
  }
}