import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose'
import { Document, Types } from 'mongoose'

@Schema({ timestamps: true, versionKey: false })
export class User extends Document {
  @Prop({ required: true })
  name: string

  @Prop({ required: true, unique: true })
  email: string
}

export const UserSchema = SchemaFactory.createForClass(User)

UserSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.createdAt
    delete ret.updatedAt
    return ret
  },
})

@Schema({ timestamps: true, versionKey: false })
export class Category extends Document {
  @Prop({ required: true })
  name: string

  @Prop({ required: true, unique: true })
  slug: string

  @Prop({ type: [String], default: [] })
  styles: string[]

  @Prop({ default: false })
  isDeleted: boolean
}

export const CategorySchema = SchemaFactory.createForClass(Category)

CategorySchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.createdAt
    delete ret.updatedAt
    return ret
  },
})

@Schema({ timestamps: true, versionKey: false })
export class Report extends Document {
  @Prop({ required: true })
  content: string

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  category: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId
}

export const ReportSchema = SchemaFactory.createForClass(Report)

ReportSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.createdAt
    delete ret.updatedAt
    return ret
  },
})

@Schema({ timestamps: true, versionKey: false, collection: 'designs' })
export class Template extends Document {
  @Prop({ required: true })
  title: string

  @Prop({ required: true })
  type: string

  @Prop({ default: 0 })
  viewCount: number

  @Prop({ default: false })
  isDeleted: boolean

  @Prop({ default: 'approved' })
  state: string

  @Prop({ type: Types.ObjectId, ref: 'Designer' })
  designerId: Types.ObjectId

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId
}

export const TemplateSchema = SchemaFactory.createForClass(Template)

TemplateSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.createdAt
    delete ret.updatedAt
    return ret
  },
})

@Schema({ timestamps: true, versionKey: false, collection: 'designerProfiles' })
export class Designer extends Document {
  @Prop({ required: true })
  name: string

  @Prop({ required: true, unique: true })
  email: string

  @Prop({ default: 0 })
  followerCount: number

  @Prop({ default: 0 })
  totalDesigns: number

  @Prop({ default: 0 })
  totalSold: number

  @Prop({ default: 0 })
  totalRevenue: number

  @Prop({ default: 0 })
  likeCount: number

  @Prop({ default: 0 })
  rating: number
}

export const DesignerSchema = SchemaFactory.createForClass(Designer)

DesignerSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.createdAt
    delete ret.updatedAt
    return ret
  },
})
