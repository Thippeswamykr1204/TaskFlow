import { ApiProperty } from '@nestjs/swagger';
import { ActivityAction } from '../schemas/activity-log.schema';

export class ActivityResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  task: string;

  @ApiProperty({ enum: ActivityAction })
  action: ActivityAction;

  @ApiProperty({ type: Object })
  meta: Record<string, unknown>;

  @ApiProperty()
  createdAt: Date;
}