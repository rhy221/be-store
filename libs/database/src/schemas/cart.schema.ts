import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

class CartItem {
  @Prop({ type: Types.ObjectId, ref: 'Design', required: true })
  productId: Types.ObjectId;


}

@Schema({ timestamps: true })
export class Cart extends Document {
  @Prop({ type: Types.ObjectId, required: true, unique: true })
  userId: Types.ObjectId;

  @Prop({ type: [CartItem], default: [] })
  items: CartItem[];

}

export const CartSchema = SchemaFactory.createForClass(Cart);

CartSchema.virtual('designerProfile', {
  ref: 'designerProfiles',           
  localField: 'userId', 
  foreignField: 'userId',      
  justOne: true,             
});