import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationGateway } from './notification.gateway';
import { Notification } from '@app/database/schemas/notification.schema';
import { CreateNotificationDto } from './notificatio.dto';

@Injectable()
export class NotificationService {
  constructor(
    @InjectModel(Notification.name) private notiModel: Model<Notification>,
    private notiGateway: NotificationGateway,
  ) {}

  // 1. Tạo thông báo mới (Ví dụ: khi ai đó mua hàng)
  async create(createDto: CreateNotificationDto) {
    const noti: any = {}
    const newNoti = await this.notiModel.create(
      {
        ...createDto,
        userId: new Types.ObjectId(createDto.userId as string),
        relatedEntityId: new Types.ObjectId(createDto.relatedEntityId as string),

      }
    );
    
    // Bắn socket xuống FE ngay lập tức
    this.notiGateway.sendNotificationToUser(createDto.userId, newNoti);
    
    return newNoti;
  }

  // 2. Lấy danh sách thông báo của user
  async findAllByUser(userId: string) {
    return this.notiModel.find({ userId: new Types.ObjectId(userId) }).sort({ createdAt: -1 }).limit(20).exec();
  }

  // 3. Đánh dấu đã đọc
  async markAsRead(id: string) {
    return this.notiModel.findByIdAndUpdate(id, { isRead: true }, { new: true });
  }
  
  // 4. Đánh dấu tất cả là đã đọc
  async markAllRead(userId: string) {
     return this.notiModel.updateMany({ userId: new Types.ObjectId(userId), isRead: false }, { isRead: true });
  }
}