import { Comment } from '@app/database/schemas/comment.schema';
import { Design } from '@app/database/schemas/design.schema';
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCommentDto, UpdateCommentDto } from './comment.dto';


@Injectable()
export class CommentService {
  constructor(
    @InjectModel(Comment.name) private commentModel: Model<Comment>,
    @InjectModel(Design.name) private productModel: Model<Design>,
  ) {}

  async createComment(userId: string, createCommentDto: CreateCommentDto) {
    const { productId, content, parentId } = createCommentDto;

    // Check if product exists
    const product = await this.productModel.findById(productId);
    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // If replying, check if parent comment exists
    if (parentId) {
      const parentComment = await this.commentModel.findById(parentId);
      if (!parentComment || parentComment.productId.toString() !== productId) {
        throw new NotFoundException('Parent comment not found');
      }
    }

    const comment = await this.commentModel.create({
      userId,
      productId,
      content,
      parentId,
    });

    // Update product comment count
    await this.productModel.findByIdAndUpdate(productId, {
      $inc: { commentCount: 1 },
    });

    return this.commentModel
      .findById(comment._id)
      .populate('userId', 'name email')
      .exec();
  }

  async updateComment(userId: string, commentId: string, updateCommentDto: UpdateCommentDto) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own comments');
    }

    comment.content = updateCommentDto.content;
    comment.isEdited = true;
    await comment.save();

    return this.commentModel
      .findById(commentId)
      .populate('userId', 'name email')
      .exec();
  }

  async deleteComment(userId: string, commentId: string) {
    const comment = await this.commentModel.findById(commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (comment.userId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own comments');
    }

    const productId = comment.productId;

    // Delete comment and its replies
    await this.commentModel.deleteMany({
      $or: [{ _id: commentId }, { parentId: commentId }],
    });

    // Update product comment count
    const remainingCount = await this.commentModel.countDocuments({ productId });
    await this.productModel.findByIdAndUpdate(productId, {
      commentCount: remainingCount,
    });

    return { message: 'Comment deleted successfully' };
  }

  async getProductComments(productId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    // Get top-level comments (no parent)
    const [comments, total] = await Promise.all([
      this.commentModel
        .find({ productId, parentId: null })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.commentModel.countDocuments({ productId, parentId: null }),
    ]);

    // Get replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await this.commentModel
          .find({ parentId: comment._id })
          .populate('userId', 'name email')
          .sort({ createdAt: 1 })
          .exec();

        return {
          ...comment.toJSON(),
          replies,
        };
      })
    );

    return {
      comments: commentsWithReplies,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}