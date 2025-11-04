import { Module } from '@nestjs/common';
import { DesignerController } from './designer.controller';
import { DesignerService } from './designer.service';
import { AuthModule } from './auth/auth.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseModule } from '@app/database';
import { UserModule } from './user/user.module';
import { MailModule } from './mail/mail.module';
import { ProductModule } from './product/product.module';
import { AnalyticsModule } from './analytics/analytics.module';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    UserModule,
    MailModule,
    ProductModule,
    AnalyticsModule,
  ],
  controllers: [DesignerController],
  providers: [DesignerService],
})
export class DesignerModule {}
