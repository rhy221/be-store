import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

/* ===================== USER ===================== */

@Schema({
  timestamps: true,
  versionKey: false,
})
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  },
});

/* ===================== CATEGORY ===================== */

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Category extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: [String], default: [] })
  styles: string[];

  @Prop({ default: false })
  isDeleted: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

CategorySchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  },
});

/* ===================== REPORT ===================== */

@Schema({
  timestamps: true,
  versionKey: false,
})
export class Report extends Document {
  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

ReportSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.createdAt;
    delete ret.updatedAt;
    return ret;
  },
});
