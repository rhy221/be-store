import { Module } from '@nestjs/common';
import { AuctionController } from './auction.controller';
import { AuctionService } from './auction.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Auction, AuctionSchema } from '@app/database/schemas/auction.schema';
import { AuctionBid, AuctionBidSchema } from '@app/database/schemas/auctionBid.schema';
import { AuctionGateway } from './auction.gateway';
import { ScheduleModule } from '@nestjs/schedule';
import { StorageModule } from '@app/storage';
import { Design, DesignSchema } from '@app/database/schemas/design.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Auction.name, schema: AuctionSchema},
      {name: AuctionBid.name, schema: AuctionBidSchema},
      {name: Design.name, schema: DesignSchema}
    ],),
    ScheduleModule.forRoot(),
    StorageModule,
  ],
  controllers: [AuctionController],
  providers: [AuctionService, AuctionGateway]
})
export class AuctionModule {}
