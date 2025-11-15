// File: libs/storage/src/models.controller.ts
import { Controller, Post, UseInterceptors, UploadedFile, Get, Param, Res, Delete, HttpCode } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import type { Response } from 'express';
import { StorageService } from './storage.service';
import { modelFileFilter } from './file-filter-3d';

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
}