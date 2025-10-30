import { Controller, Get, Param, Post, Res, UploadedFile, UseInterceptors } from "@nestjs/common";
import type { Response } from "express";
import { CloudinaryStorageService } from "./cloudinary.service";
import { FileInterceptor } from "@nestjs/platform-express";
import { memoryStorage } from "multer";
import { imageFileFilter } from "./file-filter";

@Controller('images')
export class ImagesController {
  constructor(private readonly storage: CloudinaryStorageService) {}

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

  @Get(':publicId')
  async serve(@Param('publicId') publicId: string, @Res() res: Response) {
    const url = this.storage.getUrl(publicId, { transformation: { width: 800, crop: 'limit' } });
    if (!url) return res.status(404).json({ message: 'Not found' });
    return res.redirect(url);
  }
}