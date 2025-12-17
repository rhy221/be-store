import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true,
  toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
 })
export class Purchase extends Document {
  @Prop({type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Design', required: true })
  productId: Types.ObjectId;

  // @Prop({ required: true })
  // price: number;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: true })
  orderId: Types.ObjectId;

  @Prop({ default: 0 })
  downloadCount: number;

  @Prop()
  lastDownloadAt: Date;
}

export const PurchaseSchema = SchemaFactory.createForClass(Purchase);