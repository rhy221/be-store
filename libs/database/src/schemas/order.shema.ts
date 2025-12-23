import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Design', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop()
  title: string;

  @Prop()
  imageUrl: string;



}

@Schema({ timestamps: true })
export class Order extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 'pending' })
  status: string;

  // @Prop()
  // shippingAddress: string;

  @Prop()
  paymentMethod: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

OrderSchema.virtual('designerProfile', {
  ref: 'designerProfiles',           
  localField: 'userId', 
  foreignField: 'userId',      
  justOne: true,             
});