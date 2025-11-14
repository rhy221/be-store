import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { IStorageService, UploadResult } from './interfaces';
import pLimit from 'p-limit';

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
  async uploadMany(
    files: Express.Multer.File[],
    options?: { folder?: string; tags?: string[]; publicIdPrefix?: string; concurrency?: number },
  ): Promise<UploadResult[] | { results: UploadResult[]; errors: { index: number; error: any }[] }> {
    if (!files || files.length === 0) return [];

    const concurrency = options?.concurrency ?? 3;
    const limit = pLimit(concurrency);

    const tasks = files.map((file, idx) =>
      limit(async () => {
        try {
          const uploadOpts = { folder: options?.folder, tags: options?.tags, publicId: options?.publicIdPrefix ? `${options.publicIdPrefix}-${idx}` : undefined };
          const res = await this.upload(file, uploadOpts);
          return { status: 'fulfilled', value: res } as const;
        } catch (err) {
          return { status: 'rejected', reason: err } as const;
        }
      }),
    );

    const settled = await Promise.all(tasks);

    const results: UploadResult[] = [];
    const errors: { index: number; error: any }[] = [];

    settled.forEach((s, i) => {
      if ((s as any).status === 'fulfilled') results.push((s as any).value as UploadResult);
      else errors.push({ index: i, error: (s as any).reason });
    });

    return { results, errors };
  }

  /**
   * Delete multiple public IDs. Returns summary of deleted and failed.
   */
  async deleteMany(keys: string[], options?: { concurrency?: number }): Promise<{ deleted: string[]; failed: { id: string; error: string }[] }> {
    if (!Array.isArray(keys) || keys.length === 0) return { deleted: [], failed: [] };

    const concurrency = options?.concurrency ?? 5;
    const limit = pLimit(concurrency);

    const tasks = keys.map((key) =>
      limit(async () => {
        try {
          await this.delete(key);
          return { key, ok: true } as const;
        } catch (err) {
          return { key, ok: false, error: err } as const;
        }
      }),
    );

    const results = await Promise.all(tasks);

    const deleted: string[] = [];
    const failed: { id: string; error: string }[] = [];

    results.forEach((r) => {
      if (r.ok) deleted.push(r.key);
      else failed.push({ id: r.key, error: (r as any).error?.message ?? String((r as any).error) });
    });

    return { deleted, failed };
  }
}


