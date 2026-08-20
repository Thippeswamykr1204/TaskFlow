import { ApiProperty } from '@nestjs/swagger';

export class AttachmentResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  url: string;

  @ApiProperty()
  publicId: string;

  @ApiProperty()
  fileName: string;

  @ApiProperty()
  fileType: string;

  @ApiProperty()
  fileSize: number;

  @ApiProperty({ enum: ['image', 'raw', 'video'] })
  resourceType: string;

  @ApiProperty()
  task: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}