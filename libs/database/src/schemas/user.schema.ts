import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import * as bcrypt from 'bcryptjs';


@Schema({timestamps: true})
export class User extends Document {
    
    @Prop({required: true, unique:true})
    email:string;

    @Prop({required: true})
    password: string;

    @Prop()
    fullname:string;

    @Prop()
    name:string;

    @Prop()
    role: "customer" | "designer" | "admin";

    @Prop()
    avatarUrl:string;

    @Prop()
    bio: string;

    @Prop()
    state: "active" | "banned"

    @Prop()
    followersCount: number;

    @Prop()
    totalDesigns: number;

    @Prop()
    totalSold: number;

    @Prop()
    totalRevenue: number;

    @Prop()
    followingCount: number;

    @Prop()
    verified: boolean;

}

export const UserSchema = SchemaFactory.createForClass(User) 

UserSchema.pre('save', async function (next) {
    if(!this.isModified('password')) return next;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});