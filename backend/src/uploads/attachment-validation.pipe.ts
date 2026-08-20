import {
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '../config/env.validation';
import { CloudinaryResourceType } from '../tasks/schemas/attachment.schema';

/**
 * Allowlist of MIME types accepted for task attachments: common images,
 * PDF, and a few common document types. Anything else is rejected before
 * it reaches Cloudinary.
 */
const ALLOWED_MIME_TYPES: Record<string, CloudinaryResourceType> = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'image/svg+xml': 'image',
  'application/pdf': 'raw',
  'application/msword': 'raw',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'raw',
  'application/vnd.ms-excel': 'raw',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'raw',
  'text/plain': 'raw',
};

export function resourceTypeForMime(mimeType: string): CloudinaryResourceType | undefined {
  return ALLOWED_MIME_TYPES[mimeType];
}

@Injectable()
export class AttachmentValidationPipe implements PipeTransform {
  constructor(private configService: ConfigService<EnvConfig, true>) {}

  transform(file: Express.Multer.File): Express.Multer.File {
    if (!file) {
      throw new BadRequestException({
        error: 'FILE_REQUIRED',
        message: 'No file was provided under the "file" field',
      });
    }

    if (!ALLOWED_MIME_TYPES[file.mimetype]) {
      throw new BadRequestException({
        error: 'UNSUPPORTED_FILE_TYPE',
        message: `File type "${file.mimetype}" is not allowed`,
      });
    }

    const maxSizeMb = this.configService.get('MAX_ATTACHMENT_SIZE_MB', { infer: true });
    const maxSizeBytes = maxSizeMb * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new BadRequestException({
        error: 'FILE_TOO_LARGE',
        message: `File exceeds the maximum allowed size of ${maxSizeMb}MB`,
      });
    }

    return file;
  }
}