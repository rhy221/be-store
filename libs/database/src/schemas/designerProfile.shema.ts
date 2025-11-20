import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document, Types } from "mongoose";

@Schema({
    timestamps: true,
    collection: 'designerProfiles',
})
export class DesignerProfile extends Document {

    @Prop({type: Types.ObjectId, required: true, unique: true})
    userId: Types.ObjectId;

    @Prop()
    name: string;

    @Prop({unique: true})
    email: string

    @Prop()
    avatarUrl: string;

    @Prop()
    bio: string;

    @Prop()
    status: 'active' | 'banned';

    @Prop()
    followerCount: number;

    @Prop()
    followingCount: number;

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