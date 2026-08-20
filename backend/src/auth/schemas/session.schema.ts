import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: false })
export class Session extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  tokenHash: string;

  @Prop({ type: Date, required: true })
  expiresAt: Date;

  @Prop({ type: String })
  userAgent?: string;

  @Prop({ type: String })
  ip?: string;

  @Prop({ type: Date })
  revokedAt?: Date;
}

export const SessionSchema = SchemaFactory.createForClass(Session);

SessionSchema.index({ user: 1, revokedAt: 1 });
SessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });