import { Module } from '@nestjs/common';
import { StorageService } from './storage.service';
import { ConfigModule } from '@nestjs/config';
import { ImagesController } from './image.controller';
import { ModelsController } from './models.controller';

@Module({
  imports: [ConfigModule],
  controllers: [ImagesController, ModelsController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}

;

