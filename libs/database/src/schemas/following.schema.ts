import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({timestamps: true})
export class Following extends Document {

    @Prop({required: true, type: Types.ObjectId})
    designerId: Types.ObjectId

    @Prop({required: true, type: Types.ObjectId})
    followerId: Types.ObjectId;
}

export const FollowingSchema = SchemaFactory.createForClass(Following);

FollowingSchema.virtual('designerProfile', {
  ref: 'designerProfiles',           
  localField: 'desingerId', 
  foreignField: 'userId',      
  justOne: true,             
});