import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({timestamps: true})
export class Comment extends Document {

    @Prop({required: true})
    designId: string;

    @Prop({required: true})
    customerId: string;
    
    @Prop()
    customerName: string; 
    
    @Prop()
    customerAvatar: string;
    
    @Prop({required: true})
    content: string;

    @Prop()
    rating: number;

}

export const CommentSchema = SchemaFactory.createForClass(Comment);