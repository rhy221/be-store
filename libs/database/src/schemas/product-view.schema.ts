import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class ProductView extends Document {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  userId?: Types.ObjectId;

  @Prop()
  ipAddress: string;

  @Prop()
  userAgent: string;

  @Prop({ default: Date.now, expires: 86400 })
  viewedAt: Date;
}
export const ProductViewSchema = SchemaFactory.createForClass(ProductView);
ProductViewSchema.index({ productId: 1, userId: 1, ipAddress: 1 }, { unique: true, sparse: true });