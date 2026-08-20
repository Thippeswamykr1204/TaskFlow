import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AttachmentsService } from './attachments.service';
import { Task, TaskSchema } from './schemas/task.schema';
import { Attachment, AttachmentSchema } from './schemas/attachment.schema';
import { UploadsModule } from '../uploads/uploads.module';
import { AttachmentValidationPipe } from '../uploads/attachment-validation.pipe';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Attachment.name, schema: AttachmentSchema },
    ]),
    UploadsModule,
    MailModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, AttachmentsService, AttachmentValidationPipe],
  exports: [TasksService, AttachmentsService],
})
export class TasksModule {}