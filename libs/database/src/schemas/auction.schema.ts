import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AuctionStatus  = 'upcoming' | 'active' |'ended' |'cancelled'

@Schema({ timestamps: true })
export class Auction extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ required: true })
  startingPrice: number;

  @Prop({ required: true })
  currentPrice: number;

  @Prop({ default: 0 })
  bidIncrement: number;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  sellerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  currentWinnerId: Types.ObjectId;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ type: String, enum: ['upcoming', 'active', 'ended', 'cancelled'], default: 'upcoming' })
  status: AuctionStatus;

  @Prop({ default: 0 })
  totalBids: number;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ type: Map, of: String })
  metadata: Map<string, string>;
}

export const AuctionSchema = SchemaFactory.createForClass(Auction);