export class CreateCommentDto {
  productId: string;
  content: string;
  parentId?: string;
}

export class UpdateCommentDto {
  content: string;
}