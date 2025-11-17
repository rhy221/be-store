import type { DesignType } from "@app/database/schemas/design.schema";
import { Type } from "class-transformer";
import { IsArray, IsDate, IsNotEmpty, IsNumber, IsOptional, IsString, Min } from "class-validator";

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