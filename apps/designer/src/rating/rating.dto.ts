export class CreateRatingDto {
  productId: string;
  rating: number;
  review?: string;
}

export class UpdateRatingDto {
  rating?: number;
  review?: string;
}