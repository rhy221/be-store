import type { DesignType } from "@app/database/schemas/design.schema";
import { Type } from "class-transformer";
import { IsArray, IsDate, isNotEmpty, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

export class DesignDto {

    @IsString()
    @IsNotEmpty()
    designerId: string;

    @IsString()
    title: string;

    @IsString()
    description: string;

    // @IsString()
    // @IsNotEmpty()
    // imageUrl: string;

    // @IsString()
    // @IsNotEmpty()
    // fileUrl: string;

    @IsString()
    @IsOptional()
    categoryId?:string;

    @IsArray()
    @IsOptional()
    tags?: string[];


    @IsString()
    type: DesignType;

    
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @IsOptional()
    price?: number;

    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @IsOptional()
    startingPrice?: number;

    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @IsOptional()
    bidIncrement?: number;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    startTime?: Date;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    endTime?: Date;

}

export class CreateDesignDto {

    @IsString()
    title: string;

    @IsString()
    description;

    @IsString()
    @IsOptional()
    categoryId?:string;

    @IsArray()
    @IsOptional()
    tags?: string[];

   @IsString()
    type: DesignType;

    
    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @IsOptional()
    price?: number;

    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @IsOptional()
    startingPrice?: number;

    @IsNumber()
    @Type(() => Number)
    @Min(0)
    @IsOptional()
    bidIncrement?: number;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    startTime?: Date;

    @IsDate()
    @Type(() => Date)
    @IsOptional()
    endTime?: Date;

}


export class LikeDesignDto {

    @IsString()
    @IsNotEmpty()
    designId: string;
}

export class FollowDesingerDto {
    
    @IsString()
    @IsNotEmpty()
    designerId: string;
}

export class CreateProductDto {
  name: string;
  price: number;
  description: string;
  images: string[];
  collectionIds?: string[]; // UPDATED: Array of collection IDs
  tags?: string[];
  modelFile: {
    url: string;
    publicId: string;
    format: string;
    size: number;
  };
}

export class UpdateProductDto {
  name?: string;
  price?: number;
  description?: string;
  images?: string[];
  collectionIds?: string[]; // UPDATED: Array of collection IDs
  tags?: string[];
  status?: string;
}

export class ProductQueryDto {
  page?: number = 1;
  limit?: number = 10;
  sortBy?: string = 'createdAt';
  sortOrder?: 'asc' | 'desc' = 'desc';
  search?: string;
  collectionId?: string;
  status?: string;
  includeDeleted?: boolean = false; // For admin/seller to view deleted products
}

// src/dto/collection.dto.ts
export class CreateCollectionDto {
  name: string;
  description?: string;
  coverImage?: string;
}

export class UpdateCollectionDto {
  name?: string;
  description?: string;
  coverImage?: string;
}