import { BadRequestException, Body, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { TryonService } from './tryon.service';

@Controller('tryon')
export class TryonController {
    constructor(private readonly tryOnService: TryonService) {}

  @Post('generate')
  @UseInterceptors(FileInterceptor('personImage'))
  async generate(
    @UploadedFile() personImage: Express.Multer.File,
@Body() body: { garmentUrl: string; category: string }
  ) {
    if (!personImage) throw new BadRequestException('Vui lòng tải lên ảnh của bạn.');
    if (!body.garmentUrl) throw new BadRequestException('Vui lòng chọn một mẫu áo.');

    return this.tryOnService.generateTryOn(
    personImage, 
    body.garmentUrl, 
    body.category 
  );  }
}
