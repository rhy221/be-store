import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { IStorageService, UploadResult } from './interfaces';

@Injectable()
export class StorageService implements IStorageService {
  private readonly uploadPreset?: string;

  constructor(private config: ConfigService) {
    const cloudName = this.config.get('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.config.get('CLOUDINARY_API_KEY');
    const apiSecret = this.config.get('CLOUDINARY_API_SECRET');
    this.uploadPreset = this.config.get('CLOUDINARY_UPLOAD_PRESET');
    cloudinary.config({
      cloud_name: cloudName || '',
      api_key: apiKey || '',
      api_secret: apiSecret || '',
      secure: true,
    });
  }

  async upload(file: Express.Multer.File, options?: { folder?: string; tags?: string[]; publicId?: string }): Promise<UploadResult> {
    if (!file || !file.buffer) throw new BadRequestException('File is required');

    const params: any = {
      resource_type: 'image',
    };
    if (options?.folder) params.folder = options.folder;
    if (options?.tags) params.tags = options.tags.join(',');
    if (options?.publicId) params.public_id = options.publicId;
    if (this.uploadPreset) params.upload_preset = this.uploadPreset;

    return new Promise<UploadResult>((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(params, (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error('No result from Cloudinary'));
        const res: UploadResult = {
          key: result.public_id,
          url: result.secure_url,
          width: result.width,
          height: result.height,
          format: result.format,
          bytes: result.bytes,
          raw: result,
        };
        resolve(res);
      });

      streamifier.createReadStream(file.buffer).pipe(uploadStream);
    });
  }

  async delete(key: string): Promise<void> {
    if (!key) return;
    await cloudinary.uploader.destroy(key, { invalidate: true });
  }

  getUrl(key: string, options?: { transformation?: any }): string {
    if (!key) return '';
    try {
      // cloudinary.url might be typed differently; this will work at runtime
      // @ts-ignore
      return cloudinary.url(key, { secure: true, transformation: options?.transformation });
    } catch {
      return '';
    }
  }
}

