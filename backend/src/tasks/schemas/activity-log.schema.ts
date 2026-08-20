import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export enum ActivityAction {
  CREATED = 'created',
  STATUS_CHANGED = 'status_changed',
  PRIORITY_CHANGED = 'priority_changed',
  DUE_DATE_CHANGED = 'due_date_changed',
  ATTACHMENT_ADDED = 'attachment_added',
  ATTACHMENT_REMOVED = 'attachment_removed',
  UPDATED = 'updated',
}

@Schema({ timestamps: { createdAt: true, updatedAt: false } })
export class ActivityLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  task: Types.ObjectId;

  @Prop({ enum: ActivityAction, required: true })
  action: ActivityAction;

  // Free-form context for the action, e.g. { from, to } for a status change
  // or { fileName } for an attachment event. Shape depends on `action`.
  @Prop({ type: Object, default: {} })
  meta: Record<string, unknown>;

  createdAt: Date;
}

export const ActivityLogSchema = SchemaFactory.createForClass(ActivityLog);

ActivityLogSchema.index({ task: 1, createdAt: -1 });