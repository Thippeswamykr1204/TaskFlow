import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CloudinaryResourceType = 'image' | 'raw' | 'video';

@Schema({ timestamps: true })
export class Attachment extends Document {
  @Prop({ required: true })
  url: string;

  @Prop({ required: true })
  publicId: string;

  @Prop({ required: true })
  fileName: string;

  @Prop({ required: true })
  fileType: string;

  @Prop({ required: true })
  fileSize: number;

  @Prop({ required: true, enum: ['image', 'raw', 'video'] })
  resourceType: CloudinaryResourceType;

  @Prop({ type: Types.ObjectId, ref: 'Task', required: true, index: true })
  task: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const AttachmentSchema = SchemaFactory.createForClass(Attachment);

AttachmentSchema.index({ task: 1 });