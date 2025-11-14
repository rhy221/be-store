export class DeleteImagesDto {
  publicIds: string[];
}

export class UploadManyResponseItem {
  key: string;
  url?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  raw?: any;
  error?: string;
}

export class DeleteManyResponse {
  deleted: string[];
  failed: { id: string; error: string }[];
}