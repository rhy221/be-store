import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ 
    timestamps: true,
    collection: 'auctionBids'
})
export class AuctionBid extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Auction', required: true })
  auctionId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, required: true })
  bidderId: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({ default: false })
  isAutoBid: boolean;

  @Prop({ type: Types.ObjectId, ref: 'AuctionBid' })
  previousBidId: Types.ObjectId;
}

export const AuctionBidSchema = SchemaFactory.createForClass(AuctionBid);

AuctionBidSchema.virtual('bidderProfile', {
  ref: 'DesignerProfile',
  localField: 'bidderId',
  foreignField: 'userId',
  justOne: true,
});