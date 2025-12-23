// src/notifications/dto/create-notification.dto.ts
import { IsNotEmpty, IsString, IsBoolean, IsOptional, IsEnum } from 'class-validator';
import { Types } from 'mongoose';

// Định nghĩa Enum cho loại thông báo để code clean hơn
export enum NotificationType {
  // Nhóm Activity
  SYSTEM = 'system',
  COMMENT = 'comment',
  LIKE = 'like',
  FOLLOW = 'follow',
  RATING = 'rating',
  AUCTION = 'auction',
  
  // Nhóm Sales / Item (Để dùng cho các tab khác)
//   ORDER_BOUGHT = 'order_bought', // Mua hàng thành công -> Tab Item
  ORDER_PURCHASED = 'order_purchased',     // Bán được hàng -> Tab Sales
//   ITEM_APPROVED = 'item_approved' 
}

export class CreateNotificationDto {
  @IsNotEmpty()
//   @IsMongoId({ message: 'userId must be a valid MongoDB ObjectId' })
  userId: string; 

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;

  @IsOptional()
  @IsString()
  thumbnail?: string;

  @IsOptional()
  @IsString()
  link?: string;

  @IsOptional()
  @IsString()
  relatedEntityId?: string;
  
}