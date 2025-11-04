import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { StorageModule } from './storage/storage.module';
import { DbModule } from './db/db.module';
import { AnalyticsController } from './analytics/analytics.controller';

@Module({
  imports: [
    AuthModule,
    StorageModule,
    DbModule,
  ],
  controllers: [AppController, AnalyticsController],
  providers: [AppService],
})
export class AppModule {}
