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

export class AddProductsToCollectionDto {
  productIds: string[];
}