import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AnalyticsController } from './analytics/analytics.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { DbModule } from './db/db.module';
import { CloudinaryStorageModule } from './storage/cloudinary.module';

@Module({
  imports: [
    ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['apps/be-store/src/.env', '.env'],
}),
    AuthModule,
    StorageModule,
    DbModule,
    CloudinaryStorageModule,
  ],
  controllers: [AppController, AnalyticsController],
  providers: [AppService],
})
export class AppModule {}
