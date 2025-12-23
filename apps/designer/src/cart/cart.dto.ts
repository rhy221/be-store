export class AddToCartDto {
  productId: string;
  quantity: number;
}

export class RemoveFromCartDto {
  productId: string;
}

export class UpdateCartItemDto {
  productId: string;
  quantity: number;
}