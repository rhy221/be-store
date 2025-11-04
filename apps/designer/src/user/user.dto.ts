import { IsNotEmpty, IsNumber, IsOptional, IsString } from "class-validator";

export class DesignerProfileDto {

    @IsString()
    @IsNotEmpty()
    userId: string;

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    avatarUrl?: string;

    @IsString()
    bio: string;

    @IsNumber()
    followerCount: number;

    @IsNumber()
    totalDesigns: number;

    @IsNumber()
    totalSold: number;

    @IsNumber()
    totalRevenue: number;
}

export class DesignerProfileUpdatingDto {

    @IsString()
    name: string;

    @IsString()
    @IsOptional()
    avatarUrl?: string;

    @IsString()
    bio: string;

}