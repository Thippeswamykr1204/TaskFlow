import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task, TaskStatus } from './schemas/task.schema';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { QueryTasksDto } from './dto/query-tasks.dto';

interface TasksResponse {
  success: boolean;
  data: Task[];
  meta: {
    total: number;
    page: number;
    lastPage: number;
  };
}

@Injectable()
export class TasksService {
  constructor(@InjectModel(Task.name) private taskModel: Model<Task>) {}

  async create(dto: CreateTaskDto, userId: string): Promise<Task> {
    const taskData: any = {
      ...dto,
      user: userId,
    };

    if (dto.dueDate) {
      taskData.dueDate = new Date(dto.dueDate);
    }

    const task = new this.taskModel(taskData);
    return task.save();
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

    const updateData: any = { ...dto };

    // Handle completedAt based on status transition
    if (dto.status !== undefined) {
      if (dto.status === TaskStatus.DONE && !task.completedAt) {
        updateData.completedAt = new Date();
      } else if (dto.status !== TaskStatus.DONE && task.completedAt) {
        updateData.completedAt = undefined;
      }
    }

    if (dto.dueDate) {
      updateData.dueDate = new Date(dto.dueDate);
    }

    const updated = await this.taskModel.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    return updated;
  }

  async delete(id: string, userId: string): Promise<void> {
    const result = await this.taskModel.deleteOne({
      _id: id,
      user: userId,
    });

    if (result.deletedCount === 0) {
      throw new NotFoundException({
        error: 'TASK_NOT_FOUND',
        message: 'Task not found',
      });
    }
  }
}