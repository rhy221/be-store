import { Module } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Design, DesignSchema } from '@app/database/schemas/design.schema';
import { Comment, CommentSchema } from '@app/database/schemas/comment.schema';
import { NotificationModule } from '../notification/notification.module';
import { DesignerProfile, DesignerProfileSchema } from '@app/database/schemas/designerProfile.shema';

@Module({
  imports: [MongooseModule.forFeature([
      {name: Comment.name, schema: CommentSchema},
      {name: Design.name, schema: DesignSchema},
      {name: DesignerProfile.name, schema: DesignerProfileSchema},
    ]),
  NotificationModule],
  controllers: [CommentController],
  providers: [CommentService]
})
export class CommentModule {}
