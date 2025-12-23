import { Module } from '@nestjs/common';
import { RatingController } from './rating.controller';
import { RatingService } from './rating.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Rating, RatingSchema } from '@app/database/schemas/rating.schema';
import { Design, DesignSchema } from '@app/database/schemas/design.schema';
import { Purchase, PurchaseSchema } from '@app/database/schemas/purchase.schema';
import { DesignerProfile, DesignerProfileSchema } from '@app/database/schemas/designerProfile.shema';
import { NotificationModule } from '../notification/notification.module';

@Module({
  imports: [MongooseModule.forFeature([
      {name: Rating.name, schema: RatingSchema},
      {name: Design.name, schema: DesignSchema},
      {name: Purchase.name, schema: PurchaseSchema},
      {name: DesignerProfile.name, schema: DesignerProfileSchema},


    ]),
  NotificationModule],
  controllers: [RatingController],
  providers: [RatingService]
})
export class RatingModule {}
