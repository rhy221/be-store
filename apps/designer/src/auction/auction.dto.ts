import { IsString, IsNumber, IsDate, IsArray, IsOptional, Min, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateAuctionDto {
  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsArray()
  @IsOptional()
  images?: string[];

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  startingPrice: number;

  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  bidIncrement?: number;

  @IsDate()
  @Type(() => Date)
  startTime: Date;

  @IsDate()
  @Type(() => Date)
  endTime: Date;
}


export class PlaceBidDto {
  
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  amount: number;
}

export class GetAuctionItemsDto {
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
  @IsEnum(['upcoming', 'active', 'ended', 'cancelled'])
  status?: string;

  @IsOptional()
  @IsEnum(['lowestPrice', 'highestPrice', 'newest', 'ending']) 
  sortBy?: 'lowestPrice'|'highestPrice'| 'newest'| 'ending';

  @IsOptional()
  @IsString()
  search?: string; 
  
  @IsOptional()
  page?: number;
}