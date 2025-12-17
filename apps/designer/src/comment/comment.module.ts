import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Design, DesignSchema } from '@app/database/schemas/design.schema';
import { Comment, CommentSchema } from '@app/database/schemas/comment.schema';

@Module({
  imports: [MongooseModule.forFeature([
      {name: Comment.name, schema: CommentSchema},
      {name: Design.name, schema: DesignSchema},
    ])],
  controllers: [CommentController],
  providers: [CommentService]
})
export class CommentModule {}
