export interface UploadResult {
  key: string;
  url?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  raw?: any;
}

export interface IStorageService {
  upload(file: Express.Multer.File, options?: { folder?: string; tags?: string[]; publicId?: string }): Promise<UploadResult>;
  delete(key: string): Promise<void>;
  getUrl(key: string, options?: { transformation?: any }): string;
}
