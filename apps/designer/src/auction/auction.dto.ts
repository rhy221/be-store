import { IsString, IsNumber, IsDate, IsArray, IsOptional, Min } from 'class-validator';
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
  @Min(0)
  startingPrice: number;

  @IsNumber()
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
  @Min(0)
  amount: number;
}