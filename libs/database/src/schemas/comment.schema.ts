import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true ,
  toJSON: { virtuals: true }, 
  toObject: { virtuals: true }
})
export class Comment extends Document {
  @Prop({ type: Types.ObjectId,required: true })
  userId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Design', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Comment' })
  parentId?: Types.ObjectId;

  @Prop({ default: false })
  isEdited: boolean;
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

CommentSchema.virtual('user', {
  ref: 'DesignerProfile',           
  localField: 'userId', 
  foreignField: 'userId',      
  justOne: true,             
});