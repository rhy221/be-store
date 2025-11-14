import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors, Delete, HttpCode, UploadedFiles, Body } from "@nestjs/common";
import type { Response } from "express";
import { FileInterceptor, FilesInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { imageFileFilter } from "./file-filter";
import { StorageService } from "./storage.service";
import { DeleteImagesDto, DeleteManyResponse } from "./image-multi.dto";

@Controller('images')
export class ImagesController {
  constructor(private readonly storage: StorageService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: imageFileFilter,
  }))
  async upload(@UploadedFile() file: Express.Multer.File) {
    const result = await this.storage.upload(file, { folder: 'my_app_images' });
    return result;
  }

  @Post('uploads')
  @UseInterceptors(FilesInterceptor('files', 10, {
    storage: memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 }, // per-file limit
    fileFilter: imageFileFilter,
  }))
  async uploadMany(@UploadedFiles() files: Express.Multer.File[]) {
    // returns { results, errors }
    const res = await this.storage.uploadMany(files, { folder: 'my_app_images', concurrency: 3 });
    return res;
  }

  @Get(':publicId')
  async serve(@Param('publicId') publicId: string, @Res() res: Response) {
    const url = this.storage.getUrl(publicId, { transformation: { width: 800, crop: 'limit' } });
    if (!url) return res.status(404).json({ message: 'Not found' });
    return res.redirect(url);
  }

  @Delete(':publicId')
  @HttpCode(204)
  async remove(@Param('publicId') publicId: string) {
    // Note: publicId may include folders (use URL-encoding for slashes)
    await this.storage.delete(publicId);
    // 204 No Content
    return;
  }

  @Delete()
  async removeMany(@Body() dto: DeleteImagesDto): Promise<DeleteManyResponse> {
    const ids = dto?.publicIds || [];
    const summary = await this.storage.deleteMany(ids, { concurrency: 5 });
    return summary;
  }
}