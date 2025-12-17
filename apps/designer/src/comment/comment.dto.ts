import { IsOptional, IsString } from "class-validator";

export class CreateCommentDto {
  @IsString()
  productId: string;

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  parentId?: string;
}

export class UpdateCommentDto {
  
  @IsString()
  content: string;
}