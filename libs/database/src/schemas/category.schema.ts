import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Document } from "mongoose";

@Schema({timestamps: true})
export class Category extends Document {

    @Prop({ required: true })
  name: string; // Ví dụ: "Tops"

  @Prop({ required: true, unique: true })
  slug: string; // Ví dụ: "tops"


  @Prop({ type: [String], default: [] })
  styles: string[];
    
@Prop({ default: false })
  isDeleted: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);