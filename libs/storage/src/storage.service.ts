import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { IStorageService, UploadResult } from './interfaces';
import pLimit from 'p-limit';

type ResourceType = 'image' | 'raw';

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
  // Generic resource helpers follow

  async uploadFile(
    file: Express.Multer.File,
    options?: { resourceType?: ResourceType; folder?: string; tags?: string[]; publicId?: string },
  ): Promise<UploadResult> {
    if (!file || !file.buffer) throw new BadRequestException('File is required');

    const params: any = {
      resource_type: options?.resourceType ?? 'image',
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

  async uploadFileByPath(
  file: Express.Multer.File,
  options?: { resourceType?: ResourceType; folder?: string; tags?: string[]; publicId?: string },
): Promise<UploadResult> {
  if (!file || !file.path) {
    throw new BadRequestException('File path is required');
  }

  const params: any = {
    resource_type: options?.resourceType ?? 'image',
  };
  if (options?.folder) params.folder = options.folder;
  if (options?.tags) params.tags = options.tags.join(',');
  if (options?.publicId) params.public_id = options.publicId;
  if (this.uploadPreset) params.upload_preset = this.uploadPreset;

  try {
    const fixedPath = file.path.replace(/\\/g, "/");

    const result = await cloudinary.uploader.upload(fixedPath, params);

    return {
      key: result.public_id,
      url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
      raw: result,
    };
  } catch (err) {
    throw err;
  }
}


  // Backwards compatible image upload
  async upload(file: Express.Multer.File, options?: { folder?: string; tags?: string[]; publicId?: string; byPath?: boolean }): Promise<UploadResult> {
    
    if(options && options.byPath) 
          return this.uploadFileByPath(file, { resourceType: 'image', folder: options?.folder, tags: options?.tags, publicId: options?.publicId });

    return this.uploadFile(file, { resourceType: 'image', folder: options?.folder, tags: options?.tags, publicId: options?.publicId });
  }

  // Upload 3D model / raw file
  async upload3d(file: Express.Multer.File, options?: { folder?: string; tags?: string[]; publicId?: string; byPath?: boolean }): Promise<UploadResult> {
    
    if(options && options.byPath)
          return this.uploadFileByPath(file, { resourceType: 'raw', folder: options?.folder, tags: options?.tags, publicId: options?.publicId });

    return this.uploadFile(file, { resourceType: 'raw', folder: options?.folder, tags: options?.tags, publicId: options?.publicId });
  }

  // Generic URL builder
  getFileUrl(key: string, options?: { resourceType?: ResourceType; transformation?: any; asAttachment?: boolean }): string {
    if (!key) return '';
    try {
      // @ts-ignore
      return cloudinary.url(key, {
        resource_type: options?.resourceType ?? 'image',
        secure: true,
        transformation: options?.transformation,
        ...(options?.asAttachment ? { flags: 'attachment' } : {}),
      });
    } catch {
      return '';
    }
  }

  // Backwards compatible getUrl for images
  getUrl(key: string, options?: { transformation?: any }): string {
    return this.getFileUrl(key, { resourceType: 'image', transformation: options?.transformation });
  }

  // Generic delete that supports resource type
  async deleteFile(key: string, resourceType: ResourceType = 'image'): Promise<void> {
    if (!key) return;
    await cloudinary.uploader.destroy(key, { resource_type: resourceType, invalidate: true });
  }

  // Backwards compatible delete for images
  async delete(key: string): Promise<void> {
    return this.deleteFile(key, 'image');
  }

  async uploadMany(
    files: Express.Multer.File[],
    options?: { resourceType?: ResourceType; folder?: string; tags?: string[]; publicIdPrefix?: string; concurrency?: number; byPath?: boolean},
  ): Promise<{ results: UploadResult[]; errors: { index: number; error: any }[] }> {
    if (!files || files.length === 0) return { results: [], errors: [] };

    const concurrency = options?.concurrency ?? 3;
    const limit = pLimit(concurrency);

    const tasks = files.map((file, idx) =>
      limit(async () => {
        try {
          const uploadOpts = {
            resourceType: options?.resourceType ?? 'image',
            folder: options?.folder,
            tags: options?.tags,
            publicId: options?.publicIdPrefix ? `${options.publicIdPrefix}-${idx}` : undefined,
          };
          let res;
          if(options && options.byPath)
            res = await this.uploadFileByPath(file, uploadOpts);
           res = await this.uploadFile(file, uploadOpts);
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
  async deleteMany(keys: string[], options?: { resourceType?: ResourceType; concurrency?: number }): Promise<{ deleted: string[]; failed: { id: string; error: string }[] }> {
    if (!Array.isArray(keys) || keys.length === 0) return { deleted: [], failed: [] };

    const concurrency = options?.concurrency ?? 5;
    const limit = pLimit(concurrency);

    const tasks = keys.map((key) =>
      limit(async () => {
        try {
          await this.deleteFile(key, options?.resourceType ?? 'image');
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


