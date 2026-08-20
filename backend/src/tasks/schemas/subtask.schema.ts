import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({ _id: true, timestamps: false })
export class Subtask {
  @Prop({ required: true })
  title: string;

  @Prop({ default: false })
  done: boolean;
}

export const SubtaskSchema = SchemaFactory.createForClass(Subtask);