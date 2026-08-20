import { Injectable, BadGatewayException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { EnvConfig } from '../config/env.validation';
import { CloudinaryResourceType } from '../tasks/schemas/attachment.schema';

export interface CloudinaryUploadOptions {
  resourceType: CloudinaryResourceType;
  folder?: string;
}

export interface CloudinaryUploadResult {
  url: string;
  publicId: string;
  resourceType: CloudinaryResourceType;
}

@Injectable()
export class CloudinaryService {
  constructor(private configService: ConfigService<EnvConfig, true>) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME', { infer: true }),
      api_key: this.configService.get('CLOUDINARY_API_KEY', { infer: true }),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET', { infer: true }),
    });
  }

  /**
   * Uploads a buffer via Cloudinary's upload_stream — never touches local
   * disk, so this works on ephemeral/serverless-style hosting.
   */
  async upload(
    buffer: Buffer,
    options: CloudinaryUploadOptions,
  ): Promise<CloudinaryUploadResult> {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          resource_type: options.resourceType,
          folder: options.folder ?? 'taskflow/attachments',
        },
        (error, result?: UploadApiResponse) => {
          if (error || !result) {
            reject(
              new BadGatewayException({
                error: 'UPLOAD_FAILED',
                message: error?.message ?? 'Cloudinary upload failed',
              }),
            );
            return;
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            resourceType: result.resource_type as CloudinaryResourceType,
          });
        },
      );

      uploadStream.end(buffer);
    });
  }

  /**
   * Destroys a Cloudinary asset. Requires both publicId and resourceType —
   * Cloudinary's destroy API can't resolve an asset from the URL alone.
   */
  async destroy(publicId: string, resourceType: CloudinaryResourceType): Promise<void> {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType,
    });

    if (result.result !== 'ok' && result.result !== 'not found') {
      throw new BadGatewayException({
        error: 'UPLOAD_FAILED',
        message: `Cloudinary destroy failed for ${publicId}: ${result.result}`,
      });
    }
  }
}