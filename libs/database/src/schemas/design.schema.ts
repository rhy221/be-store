import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({timestamps: true})
export class Design extends Document {

    @Prop({required: true})
    designerId: string;

    @Prop()
    title: string;

    @Prop()
    description: string;

    @Prop()
    imagesUrl: string[];

    @Prop()
    fileUrl: string;

    @Prop()
    categoryId: string;

    @Prop()
    tags: string[];

    @Prop()
    price: number;

    @Prop()
    type: string;

    @Prop()
    viewCount: number;

    @Prop()
    likeCount: number;

    @Prop()
    state: 'approved' | 'notApproved';
}

export const DesignSchema = SchemaFactory.createForClass(Design);