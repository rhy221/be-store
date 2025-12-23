import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

export type DesignType = "fixed" | "auction" | "gallery";
export type AuctionStatus  = 'upcoming' | 'active' |'ended' |'cancelled'

class ModelFile {
  @Prop({ required: true })
  publicId: string; // ID trên Cloudinary

  @Prop({ required: true })
  format: string;   // glb, fbx...

  // @Prop({ required: true })
  // resourceType: string; // 'image' hoặc 'raw' (Lấy từ kết quả upload)
  @Prop()
  originalName: string;

  @Prop({ required: true })
  size: number; // in bytes
}

@Schema({ timestamps: true,
toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
})
export class Design extends Document {

    @Prop({required: true, type: Types.ObjectId})
    designerId: Types.ObjectId;

    @Prop()
    title: string;

    @Prop()
    description: string;

    @Prop()
    imageUrls: string[];

    // @Prop()
    // modelUrls: string[];

    @Prop()
    displayModelUrl: string;

    @Prop({ type: Types.ObjectId, ref: 'Category', })
  categoryId: Types.ObjectId;

  @Prop()
  style: string;

  @Prop({  enum: ['Male', 'Female', 'Unisex'], })
  gender: string;

    @Prop()
    tags: string[];
    
    @Prop()
    type: DesignType;

    // @Prop({ type: Types.ObjectId, ref: 'Collection' })
    // collectionId: Types.ObjectId;
  //   @Prop({ type: [{ type: Types.ObjectId, ref: 'Collection' }], default: [] })
  // collectionIds: Types.ObjectId[];

    @Prop({ default: 0 })
    purchaseCount: number;

    @Prop({ default: 0 })
    totalEarning: number;

    @Prop({ type: ModelFile, required: true })
    modelFiles: ModelFile[];
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

    @Prop({ type: String, enum: ['upcoming', 'active', 'ended', 'cancelled'] })
    status: AuctionStatus;

    @Prop({ })
    totalBids: number;

    @Prop({ default: 0 })
    viewCount: number;

    @Prop({ default: 0 })
    likeCount: number;

      @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop({ default: 0 })
  commentCount: number;

  // Soft Delete fields
  @Prop({ default: false })
  isDeleted: boolean;

  @Prop()
  deletedAt: Date;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  deletedBy: Types.ObjectId;

    @Prop({ type: Map, of: String })
    metadata: Map<string, string>;

    @Prop()
    state: 'approved' | 'notApproved';
}

export const DesignSchema = SchemaFactory.createForClass(Design);

DesignSchema.virtual('designerProfile', {
  ref: 'DesignerProfile',           
  localField: 'designerId', 
  foreignField: 'userId',      
  justOne: true,             
});

DesignSchema.virtual('currentWinnerProfile', {
  ref: 'DesignerProfile',           
  localField: 'currentWinnerId', 
  foreignField: 'userId',      
  justOne: true,             
});