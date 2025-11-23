import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Collection, CollectionSchema } from '@app/database/schemas/collection.schema';
import { Design, DesignSchema } from '@app/database/schemas/design.schema';

@Module({
  imports: [MongooseModule.forFeature([
      {name: Collection.name, schema: CollectionSchema},
      {name: Design.name, schema: DesignSchema},
    ])],
  controllers: [CommentController],
  providers: [CommentService]
})
export class CommentModule {}
