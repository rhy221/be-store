import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({ timestamps: true,
toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
})
export class Following extends Document {

    @Prop({required: true, type: Types.ObjectId})
    designerId: Types.ObjectId

    @Prop({required: true, type: Types.ObjectId})
    followerId: Types.ObjectId;
}

export const FollowingSchema = SchemaFactory.createForClass(Following);

FollowingSchema.virtual('designerProfile', {
    ref: 'DesignerProfile',  // Tên model trong @Schema(name) hoặc tên class
    localField: 'designerId', 
    foreignField: 'userId',      
    justOne: true,             
});