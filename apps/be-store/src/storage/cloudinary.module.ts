import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ImagesController } from "./image.controller";
import { CloudinaryStorageService } from "./cloudinary.service";

@Module({
  imports: [ConfigModule],
  controllers: [ImagesController],
  providers: [CloudinaryStorageService],
  exports: [CloudinaryStorageService],
})
export class CloudinaryStorageModule {}