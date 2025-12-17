import { Type } from "class-transformer";
import { IsNumber, IsString, Max, Min } from "class-validator";

export class CreateRatingDto {

  @IsString()
  productId: string;

   @IsNumber()
    @Type(() => Number)
    @Min(0)
    @Max(5)
  rating: number;

  @IsString()
  review?: string;
}

export class UpdateRatingDto {

  @IsNumber()
    @Type(() => Number)
    @Min(0)
    @Max(5)
  rating?: number;

  @IsString()
  review?: string;
}