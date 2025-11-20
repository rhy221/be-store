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

@Module({
  imports: [MongooseModule.forFeature([
    {name: Design.name, schema: DesignSchema},
    {name: DesignerProfile.name, schema: DesignerProfileSchema},
    {name: Comment.name, schema: CommentSchema},
    {name: Category.name, schema: CategorySchema},
    {name: Like.name, schema: LikeSchema},
    {name: Following.name, schema: FollowingSchema},

  ]),
  StorageModule,
  ConvertModule],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule {}
