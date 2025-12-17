import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true, versionKey: false })
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: true, enum: ['designer', 'customer'], default: 'customer' })
  role: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

@Schema({ timestamps: true, versionKey: false })
export class Category extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ type: [String], default: [] })
  styles: string[];

  @Prop({ default: false })
  isDeleted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

@Schema({ timestamps: true, versionKey: false })
export class Report extends Document {
  @Prop({ required: true })
  content: string;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const ReportSchema = SchemaFactory.createForClass(Report);

@Schema({ timestamps: true, versionKey: false, collection: 'designs' })
export class Template extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  type: string;

  @Prop({ default: 0 })
  viewCount: number;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ default: 'approved' })
  state: string;

  @Prop({ type: Types.ObjectId, ref: 'Designer' })
  designerId: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  imageUrls: string[];

  @Prop()
  description?: string;

  @Prop()
  displayModelUrl?: string;

  @Prop()
  style?: string;

  @Prop()
  gender?: string;

  @Prop({ default: [] })
  tags: string[];

  @Prop({ default: 0 })
  purchaseCount: number;

  @Prop({ default: 0 })
  totalEarning: number;

  @Prop({ type: [{ publicId: String, format: String, originalName: String, size: Number }] })
  modelFiles: { publicId: string; format: string; originalName: string; size: number }[];

  @Prop()
  startingPrice?: number;

  @Prop()
  bidIncrement?: number;

  @Prop()
  startTime?: Date;

  @Prop()
  endTime?: Date;

  @Prop({ default: 0 })
  currentPrice: number;

  @Prop({ default: 'pending' })
  status: string;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  averageRating: number;

  @Prop({ default: 0 })
  ratingCount: number;

  @Prop({ default: 0 })
  commentCount: number;

  @Prop()
  currentWinnerId?: Types.ObjectId;

  @Prop({ default: 0 })
  totalBids: number;

  createdAt: Date;
  updatedAt: Date;

  
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

@Schema({ timestamps: true, versionKey: false, collection: 'designerProfiles' })
export class Designer extends Document {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ default: 0 })
  followerCount: number;

  @Prop({ default: 0 })
  totalDesigns: number;

  @Prop({ default: 0 })
  totalSold: number;

  @Prop({ default: 0 })
  totalRevenue: number;

  @Prop({ default: 0 })
  likeCount: number;

  @Prop({ default: 0 })
  rating: number;

  @Prop()
  avatarUrl?: string;

  @Prop()
  bio?: string;

  @Prop()
  status?: string;

  @Prop()
  followingCount?: number;

  @Prop()
  bannerUrl?: string;

  createdAt: Date;
  updatedAt: Date;
}

export const DesignerSchema = SchemaFactory.createForClass(Designer);

@Schema({ timestamps: true, versionKey: false })
export class UnlockRequest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  reason: string;

  @Prop({ default: 'pending' })
  status: string;

  createdAt: Date;
  updatedAt: Date;
}

export const UnlockRequestSchema = SchemaFactory.createForClass(UnlockRequest);
