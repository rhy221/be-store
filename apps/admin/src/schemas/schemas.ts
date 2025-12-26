import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';

@Schema({timestamps: true})
export class User extends Document {
    
    @Prop({required: true, unique:true})
    email:string;

    @Prop({required: true})
    password: string;

    @Prop()
    role: ("customer" | "designer" | "admin")[];

    @Prop()
    state: "active" | "banned"

    @Prop()
    verified: boolean;

}

export const UserSchema = SchemaFactory.createForClass(User);

UserSchema.pre('save', async function (next) {
    if(!this.isModified('password')) return next;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
});

@Schema({
    timestamps: true,
    collection: 'designerProfiles',
})
export class DesignerProfile extends Document {

    @Prop({type: Types.ObjectId, required: true, unique: true})
    userId: Types.ObjectId;

    @Prop()
    name: string;

    @Prop({unique: true})
    email: string

    @Prop()
    avatarUrl: string;

    @Prop()
    bannerUrl: string;

    @Prop()
    bio: string;

    @Prop()
    status: 'active' | 'banned';

    @Prop()
    followerCount: number;

    @Prop()
    followingCount: number;

    @Prop()
    totalDesigns: number;

    @Prop()
    totalSold: number;

    @Prop()
    totalRevenue: number;

    @Prop()
    likeCount: number;

    @Prop()
    rating: number;
}

export const DesignerProfileSchema = SchemaFactory.createForClass(DesignerProfile);

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

  @Prop({
    type: [{ publicId: String, format: String, originalName: String, size: Number }],
  })
  modelFiles: {
    publicId: string;
    format: string;
    originalName: string;
    size: number;
  }[];

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


@Schema({ timestamps: true })
export class UnlockRequest extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ enum: ['pending', 'processed'] ,default: 'pending' })
  status: string;

  @Prop({ default: 'pending' })
  rejectReason: string;

}

export const UnlockRequestSchema = SchemaFactory.createForClass(UnlockRequest);


@Schema({ timestamps: true }) 
export class BanLog extends Document {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  targetUserId: Types.ObjectId; 

  // @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  // actorId: Types.ObjectId; 

  @Prop({ 
    required: true, 
    enum: ['ban', 'unban', 'reject_unlock'] 
  })
  action: string; // Loại hành động

  @Prop({ required: true })
  reason: string; // Lý do thực hiện

  // @Prop({ type: Date })
  // expiresAt: Date; // (Tùy chọn) Ngày hết hạn nếu là ban có thời hạn
}

export const BanLogSchema = SchemaFactory.createForClass(BanLog);


@Schema({
    timestamps: true,
    collection: 'adminProfiles',
})
export class AdminProfile extends Document {

    @Prop({type: Types.ObjectId, required: true, unique: true})
    userId: Types.ObjectId;

    @Prop()
    name: string;

    @Prop({unique: true})
    email: string

    @Prop()
    avatarUrl: string;

    @Prop({default: 'active'})
    status: 'active' | 'banned';

}

export const AdminProfileSchema = SchemaFactory.createForClass(AdminProfile);