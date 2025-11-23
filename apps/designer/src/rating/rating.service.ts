import { Design } from '@app/database/schemas/design.schema';
import { Purchase } from '@app/database/schemas/purchase.schema';
import { Rating } from '@app/database/schemas/rating.schema';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateRatingDto, UpdateRatingDto } from './rating.dto';


@Injectable()
export class RatingService {
  constructor(
    @InjectModel(Rating.name) private ratingModel: Model<Rating>,
    @InjectModel(Design.name) private productModel: Model<Design>,
    @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
  ) {}

  async createRating(userId: string, createRatingDto: CreateRatingDto) {
    const { productId, rating, review } = createRatingDto;

    // Check if user purchased the product
    const purchase = await this.purchaseModel.findOne({ userId, productId });
    if (!purchase) {
      throw new ForbiddenException('You must purchase this product before rating');
    }

    // Check if already rated
    const existingRating = await this.ratingModel.findOne({ userId, productId });
    if (existingRating) {
      throw new BadRequestException('You have already rated this product. Use update instead.');
    }

    // Validate rating value
    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    // Create rating
    const newRating = await this.ratingModel.create({
      userId,
      productId,
      rating,
      review,
    });

    // Update product rating statistics
    await this.updateProductRatingStats(productId);

    return newRating;
  }

  async updateRating(userId: string, productId: string, updateRatingDto: UpdateRatingDto) {
    const rating = await this.ratingModel.findOne({ userId, productId });
    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (updateRatingDto.rating !== undefined) {
      if (updateRatingDto.rating < 1 || updateRatingDto.rating > 5) {
        throw new BadRequestException('Rating must be between 1 and 5');
      }
      rating.rating = updateRatingDto.rating;
    }

    if (updateRatingDto.review !== undefined) {
      rating.review = updateRatingDto.review;
    }

    await rating.save();

    // Update product rating statistics
    await this.updateProductRatingStats(productId);

    return rating;
  }

  async deleteRating(userId: string, productId: string) {
    const rating = await this.ratingModel.findOne({ userId, productId });
    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    await rating.deleteOne();

    // Update product rating statistics
    await this.updateProductRatingStats(productId);

    return { message: 'Rating deleted successfully' };
  }

  async getProductRatings(productId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      this.ratingModel
        .find({ productId })
        .populate('userId', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.ratingModel.countDocuments({ productId }),
    ]);

    return {
      ratings,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getUserRating(userId: string, productId: string) {
    return this.ratingModel.findOne({ userId, productId }).exec();
  }

  private async updateProductRatingStats(productId: string) {
    const ratings = await this.ratingModel.find({ productId }).exec();
    
    if (ratings.length === 0) {
      await this.productModel.findByIdAndUpdate(productId, {
        averageRating: 0,
        ratingCount: 0,
      });
      return;
    }

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;

    await this.productModel.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      ratingCount: ratings.length,
    });
  }
}
