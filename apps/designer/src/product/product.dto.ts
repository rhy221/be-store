import { Type } from "class-transformer";
import { IsArray, IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class DesignDto {

    @IsString()
    @IsNotEmpty()
    designerId: string;

    @IsString()
    title: string;

    @IsString()
    description;

    @IsString()
    @IsNotEmpty()
    imageUrl: string;

    @IsString()
    @IsNotEmpty()
    fileUrl: string;

    @IsString()
    categoryId:string;

    @IsArray()
    tags: string[];

    @IsNumber()
    price: number;

    @IsString()
    type: string;

}

export class CreateDesignDto {

    @IsString()
    title: string;

    @IsString()
    description;

    @IsString()
    categoryId:string;

    @IsArray()
    @IsOptional()
    tags?: string[];

    @Type(() => Number)
    @IsNumber()
    price: number;

    @IsString()
    type: "fixed" | "auction";

}