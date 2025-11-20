import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type DesignType = "fixed" | "auction" | "gallery";
export type AuctionStatus  = 'upcoming' | 'active' |'ended' |'cancelled'

@Schema({timestamps: true})
export class Design extends Document {

    @Prop({required: true, type: Types.ObjectId})
    designerId: Types.ObjectId;

    @Prop()
    title: string;

    @Prop()
    description: string;

    @Prop()
    imageUrls: string[];

    @Prop()
    modelUrls: string[];

    @Prop()
    displayModelUrl: string;

    @Prop()
    categoryId: string;

    @Prop()
    tags: string[];
    
    @Prop()
    type: DesignType;

    //fixed
    @Prop()
    price: number;

    //auction
    @Prop()
    startingPrice: number;

    @Prop()
    bidIncrement: number;

    @Prop()
    startTime: Date;

    @Prop()
    endTime: Date;

    @Prop()
    currentPrice: number;

    @Prop({ type: Types.ObjectId })
    currentWinnerId: Types.ObjectId;

    @Prop({ type: String, enum: ['upcoming', 'active', 'ended', 'cancelled'], default: 'upcoming' })
    status: AuctionStatus;

    @Prop({ default: 0 })
    totalBids: number;

    @Prop({ default: 0 })
    viewCount: number;

    @Prop({ default: 0 })
    likeCount: number;

    @Prop({ type: Map, of: String })
    metadata: Map<string, string>;

    @Prop()
    state: 'approved' | 'notApproved';
}

export const DesignSchema = SchemaFactory.createForClass(Design);

DesignSchema.virtual('designerProfile', {
  ref: 'designerProfiles',           
  localField: 'desingerId', 
  foreignField: 'userId',      
  justOne: true,             
});