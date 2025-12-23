import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { NotificationType } from 'apps/designer/src/notification/notificatio.dto';
import { Document, Types } from 'mongoose';


@Schema({ timestamps: true })
export class Notification extends Document{
  @Prop({ required: true, type: Types.ObjectId })
  userId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop()
  message: string;

@Prop({ required: true, enum: NotificationType, default: NotificationType.SYSTEM })  type: string;

  @Prop({ default: false })
  isRead: boolean;
  
  @Prop()
  thumbnail?: string; // Avatar hoặc ảnh sản phẩm liên quan

  @Prop()
  link?: string; // Link để redirect khi click vào

  @Prop({ type: Types.ObjectId })
  relatedEntityId?: Types.ObjectId;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);