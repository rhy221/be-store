import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({timestamps: true})
export class Like extends Document {

    @Prop({required: true, type: Types.ObjectId, ref: 'Design'})
    designId: Types.ObjectId

    @Prop({required: true, type: Types.ObjectId})
    viewerId: Types.ObjectId;
}

export const LikeSchema = SchemaFactory.createForClass(Like);