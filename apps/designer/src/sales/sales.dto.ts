import { IsDateString, IsOptional, IsString } from 'class-validator';

export class GetSalesDto {
  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsString()
  type?: string; // 'all', 'fixed', 'auction'

  @IsOptional()
  @IsString()
  search?: string; // Keyword
}
