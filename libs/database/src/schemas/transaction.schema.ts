import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";
import { Design } from "./design.schema";

@Schema({timestamps: true})
export class Transaction extends Document {

    @Prop({required: true})
    designerId: string;

    @Prop({required: true})
    cusutomerId: string;
    
    @Prop()
    items: Design[];

    @Prop()
    totalAmount: number;
    
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);