import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AnalyticsController } from './analytics/analytics.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from '@app/storage';
import { DbModule } from './db/db.module';
import { CloudinaryStorageModule } from './storage/cloudinary.module';
import { AnalyticsController } from './analytics/analytics.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: ['apps/be-store/src/.env', '.env'],
}),
    AuthModule,
    StorageModule,
    DbModule,
  ],
  controllers: [AppController, AnalyticsController],
  providers: [AppService],
})
export class AppModule {}
