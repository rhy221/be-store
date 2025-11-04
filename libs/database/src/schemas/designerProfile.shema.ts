import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({
    timestamps: true,
    collection: 'designerProfiles',
})
export class DesignerProfile extends Document {

    @Prop({required: true, unique: true})
    userId: string;

    @Prop()
    name: string;

    @Prop()
    avatarUrl: string;

    @Prop()
    bio: string;

    @Prop()
    status: 'active' | 'banned';

    @Prop()
    followerCount: number;

    @Prop()
    totalDesigns: number;

    @Prop()
    totalSold: number;

    @Prop()
    totalRevenue: number;

    @Prop()
    likeCount: number;

    @Prop()
    rating: number;
}

export const DesignerProfileSchema = SchemaFactory.createForClass(DesignerProfile);