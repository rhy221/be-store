// File: libs/storage/src/models.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Res, Delete, HttpCode, UploadedFiles, Body } from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { StorageService } from './storage.service';
import { modelFileFilter } from './file-filter-3d';
import { DeleteImagesDto, DeleteManyResponse } from './image-multi.dto';

@Controller('models')
export class ModelsController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 200 * 1024 * 1024 }, // 200MB upper bound; adjust as needed
    fileFilter: modelFileFilter,
  }))
  async upload3d(@UploadedFile() file: Express.Multer.File) {
    const result = await this.storage.upload3d(file, { folder: '3d_models' });
    return result;
  }

   @Post('uploads')
    @UseInterceptors(FilesInterceptor('files', 10, {
      storage: memoryStorage(),
      limits: { fileSize: 200 * 1024 * 1024 }, // per-file limit
      fileFilter: modelFileFilter,
    }))
    async uploadMany(@UploadedFiles() files: Express.Multer.File[]) {
      // returns { results, errors }
      const res = await this.storage.uploadMany(files, { resourceType: 'raw', folder: '3d_models', concurrency: 3 });
      return res;
    }

  @Get(':publicId/download')
  async download3d(@Param('publicId') publicId: string, @Res() res: Response) {
    const url = this.storage.getFileUrl(publicId, { resourceType: 'raw', asAttachment: true });
    if (!url) return res.status(404).json({ message: 'Not found' });
    return res.redirect(url);
  }

  @Delete(':publicId')
  @HttpCode(204)
  async delete3d(@Param('publicId') publicId: string) {
    await this.storage.deleteFile(publicId, 'raw');
    return;
  }

  @Delete()
    async removeMany(@Body() dto: DeleteImagesDto): Promise<DeleteManyResponse> {
      const ids = dto?.publicIds || [];
      const summary = await this.storage.deleteMany(ids, { resourceType: 'raw', concurrency: 5 });
      return summary;
    }
}