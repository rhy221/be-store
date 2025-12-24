import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Design, DesignSchema } from '@app/database/schemas/design.schema';
import { Comment, CommentSchema } from '@app/database/schemas/comment.schema';
import { Category, CategorySchema } from '@app/database/schemas/category.schema';
import { StorageModule } from '@app/storage';
import { ConvertModule } from '@app/convert';
import { DesignerProfile, DesignerProfileSchema } from '@app/database/schemas/designerProfile.shema';
import { Like, LikeSchema } from '@app/database/schemas/like.schema';
import { Following, FollowingSchema } from '@app/database/schemas/following.schema';
import { Purchase, PurchaseSchema } from '@app/database/schemas/purchase.schema';
import { Collection, CollectionSchema } from '@app/database/schemas/collection.schema';
import { ProductView, ProductViewSchema } from '@app/database/schemas/product-view.schema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [MongooseModule.forFeature([
    {name: Design.name, schema: DesignSchema},
    {name: DesignerProfile.name, schema: DesignerProfileSchema},
    {name: Comment.name, schema: CommentSchema},
    {name: Category.name, schema: CategorySchema},
    {name: Like.name, schema: LikeSchema},
    {name: Following.name, schema: FollowingSchema},
    {name: Collection.name, schema: CollectionSchema},
    {name: Purchase.name, schema: PurchaseSchema},
    {name: ProductView.name, schema: ProductViewSchema},

  ]),
  StorageModule,
  ConvertModule,
  NotificationModule,
],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService]
})
export class ProductModule {}
