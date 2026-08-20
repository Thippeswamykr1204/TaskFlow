import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';
import { AttachmentsService } from './attachments.service';
import { ActivityService } from './activity.service';
import { Task, TaskSchema } from './schemas/task.schema';
import { Attachment, AttachmentSchema } from './schemas/attachment.schema';
import { ActivityLog, ActivityLogSchema } from './schemas/activity-log.schema';
import { UploadsModule } from '../uploads/uploads.module';
import { AttachmentValidationPipe } from '../uploads/attachment-validation.pipe';
import { MailModule } from '../mail/mail.module';
import { LocationModule } from '../location/location.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Task.name, schema: TaskSchema },
      { name: Attachment.name, schema: AttachmentSchema },
      { name: ActivityLog.name, schema: ActivityLogSchema },
    ]),
    UploadsModule,
    MailModule,
    LocationModule,
  ],
  controllers: [TasksController],
  providers: [TasksService, AttachmentsService, ActivityService, AttachmentValidationPipe],
  exports: [TasksService, AttachmentsService, ActivityService],
})
export class TasksModule {}