import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Subtask, SubtaskSchema } from './subtask.schema';

export enum TaskStatus {
  BACKLOG = 'BACKLOG',
  TODO = 'TODO',
  IN_PROGRESS = 'IN_PROGRESS',
  DONE = 'DONE',
}

export enum Priority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

@Schema({ timestamps: true })
export class Task extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description?: string;

  @Prop({ enum: TaskStatus, default: TaskStatus.BACKLOG })
  status: TaskStatus;

  @Prop({ enum: Priority, default: Priority.MEDIUM })
  priority: Priority;

  @Prop()
  dueDate?: Date;

  @Prop()
  completedAt?: Date;

  @Prop(
    {
      type: {
        city: { type: String, required: true },
        lat: { type: Number },
        lng: { type: Number },
      },
    },
  )
  location?: {
    city: string;
    lat?: number;
    lng?: number;
  };

  @Prop({ default: [] })
  tags: string[];

  @Prop({ type: [SubtaskSchema], default: [] })
  subtasks: Subtask[];

  @Prop({ default: false })
  archived: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  user: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const TaskSchema = SchemaFactory.createForClass(Task);

TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ user: 1, dueDate: 1 });