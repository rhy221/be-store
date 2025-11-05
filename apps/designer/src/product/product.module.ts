import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Design, DesignSchema } from '@app/database/schemas/design.schema';
import { Comment, CommentSchema } from '@app/database/schemas/comment.schema';
import { Category, CategorySchema } from '@app/database/schemas/category.schema';

@Module({
  imports: [MongooseModule.forFeature([
    {name: Design.name, schema: DesignSchema},
    {name: Comment.name, schema: CommentSchema},
    {name: Category.name, schema: CategorySchema},

  ])],
  controllers: [ProductController],
  providers: [ProductService]
})
export class ProductModule {}
