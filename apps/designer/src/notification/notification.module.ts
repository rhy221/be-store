import { Module } from '@nestjs/common';
import { NotificationController } from './notification.controller';
import { NotificationService } from './notification.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from '@app/database/schemas/notification.schema';
import { NotificationGateway } from './notification.gateway';

@Module({
  imports: [MongooseModule.forFeature([
    {name: Notification.name, schema: NotificationSchema}
  ])],
  controllers: [NotificationController],
  providers: [NotificationService, NotificationGateway],
  exports: [NotificationService, NotificationGateway]
})
export class NotificationModule {}
