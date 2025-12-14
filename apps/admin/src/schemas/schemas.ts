import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  email: string;
}

export const UserSchema = SchemaFactory.createForClass(User);

@Schema()
export class Template extends Document {
  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;
}

export const TemplateSchema = SchemaFactory.createForClass(Template);

@Schema()
export class Category extends Document {
  @Prop({ required: true })
  name: string;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

@Schema()
export class Report extends Document {
  @Prop({ required: true })
  content: string;
}

export const ReportSchema = SchemaFactory.createForClass(Report);
