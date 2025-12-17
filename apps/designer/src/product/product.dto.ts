import type { DesignType } from "@app/database/schemas/design.schema";
import { Transform, Type } from "class-transformer";
import { IsArray, IsDate, IsEnum, IsInt, isNotEmpty, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

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

    @IsString()
    @IsOptional()
    style?:string;

    @IsString()
    @IsOptional()
    gender?:string;

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

export class UpdateDesignDto {

    @IsString()
    title: string;

    @IsString()
    description;

    @Transform(({ value }) => {
        if (typeof value === 'string') return [value]; // Nếu là 1 chuỗi -> biến thành mảng
        if (!value) return []; // Nếu null/undefined -> mảng rỗng
        return value; // Nếu đã là mảng -> giữ nguyên
    })
    @IsArray()
    @IsOptional()
    oldImages: string[];

    @Transform(({ value }) => {
        if (typeof value === 'string') return [value]; // Nếu là 1 chuỗi -> biến thành mảng
        if (!value) return []; // Nếu null/undefined -> mảng rỗng
        return value; // Nếu đã là mảng -> giữ nguyên
    })
    @IsArray()
    @IsOptional()
    oldModels: string[];

    @IsString()
    @IsOptional()
    categoryId?:string;

     @IsString()
    @IsOptional()
    style?:string;

    @IsString()
    @IsOptional()
    gender?:string;

    @IsArray()
    @IsOptional()
    tags?: string[];


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


export class GetStoreItemsDto {
  @IsOptional()
  @IsString()
  categorySlug?: string; 

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsEnum(['Male', 'Female', 'Unisex'])
  gender?: string;

  @IsOptional()
  @IsEnum(['lowest', 'highest']) // Giá thấp nhất / cao nhất
  sortPrice?: 'lowest' | 'highest';

  @IsOptional()
  @IsString()
  search?: string; // Tìm theo title
  
  @IsOptional()
  page?: number;
}

export class GetGalleryItemsDto {
  @IsOptional()
  @IsString()
  categorySlug?: string; 

  @IsOptional()
  @IsString()
  style?: string;

  @IsOptional()
  @IsEnum(['Male', 'Female', 'Unisex'])
  gender?: string;

  @IsOptional()
  @IsString()
  search?: string; // Tìm theo title
  
  @IsOptional()
  page?: number;
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

export enum DesignTypeFilter {
  FIXED = 'fixed', // Tương ứng với 'Store'
  AUCTION = 'auction',
  GALLERY = 'gallery',
}

export class GetUserDesignsDto {
  @IsOptional()
  @IsEnum(DesignTypeFilter)
  @Transform(({ value }) => value === '' || value === 'all' ? undefined : value)
  type?: DesignTypeFilter;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 12;
}