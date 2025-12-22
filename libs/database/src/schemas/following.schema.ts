import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { DesignerProfile } from "./designerProfile.shema";

@Schema({ timestamps: true,
toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
})
export class Following extends Document {

    @Prop({required: true, type: Types.ObjectId})
    designerId: Types.ObjectId

    @Prop({required: true, type: Types.ObjectId})
    followerId: Types.ObjectId;

    followerProfile?: DesignerProfile;
    designerProfile?: DesignerProfile;
}

export const FollowingSchema = SchemaFactory.createForClass(Following);

FollowingSchema.virtual('designerProfile', {
    ref: 'DesignerProfile',  
    localField: 'designerId', 
    foreignField: 'userId',      
    justOne: true,             
});

FollowingSchema.virtual('followerProfile', {
    ref: 'DesignerProfile',  
    localField: 'followerId', 
    foreignField: 'userId',      
    justOne: true,             
});