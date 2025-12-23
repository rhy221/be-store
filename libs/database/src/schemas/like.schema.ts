import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";
import { DesignerProfile } from "./designerProfile.shema";

@Schema({ timestamps: true,
toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
})
export class Like extends Document {

    @Prop({required: true, type: Types.ObjectId, ref: 'Design'})
    designId: Types.ObjectId

    @Prop({required: true, type: Types.ObjectId})
    viewerId: Types.ObjectId;

    viewerProfile?: DesignerProfile;
}

export const LikeSchema = SchemaFactory.createForClass(Like);

LikeSchema.virtual('viewerProfile', {
    ref: 'DesignerProfile',  
    localField: 'viewerId', 
    foreignField: 'userId',      
    justOne: true,             
});