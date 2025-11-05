import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({timestamps: true})
export class Transaction extends Document {

    @Prop({required: true})
    customerId: string;

    @Prop()
    items: designItemType[];

    @Prop()
    totalAmount: number;

}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);

type designItemType = {
    designId: string,
    designerId: string,
    price: number,
    category: string,
}