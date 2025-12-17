import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true,
toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
})
export class Rating extends Document {
  @Prop({ type: Types.ObjectId, required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Design', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop()
  review: string;

  @Prop({ default: false })
  hasBeenEdited: boolean; // Track if already edited once

  @Prop()
  editedAt: Date;
}

export const RatingSchema = SchemaFactory.createForClass(Rating);
RatingSchema.index({ userId: 1, productId: 1 }, { unique: true });

RatingSchema.virtual('user', {
  ref: 'DesignerProfile',           
  localField: 'userId', 
  foreignField: 'userId',      
  justOne: true,             
});