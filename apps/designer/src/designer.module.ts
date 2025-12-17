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
import { AuctionModule } from './auction/auction.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { PurchaseModule } from './purchase/purchase.module';
import { CollectionModule } from './collection/collection.module';
import { RatingModule } from './rating/rating.module';
import { CommentModule } from './comment/comment.module';
import { SalesModule } from './sales/sales.module';
import { TryonModule } from './tryon/tryon.module';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    UserModule,
    MailModule,
    ProductModule,
    AnalyticsModule,
    AuctionModule,
    CartModule,
    OrderModule,
    PurchaseModule,
    CollectionModule,
    RatingModule,
    CommentModule,
    SalesModule,
    TryonModule,
  ],
  controllers: [DesignerController],
  providers: [DesignerService],
})
export class DesignerModule {}
