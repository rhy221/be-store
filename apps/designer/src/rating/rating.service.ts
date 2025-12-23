import { Design } from '@app/database/schemas/design.schema';
import { Purchase } from '@app/database/schemas/purchase.schema';
import { Rating } from '@app/database/schemas/rating.schema';
import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRatingDto, UpdateRatingDto } from './rating.dto';
import { DesignerProfile } from '@app/database/schemas/designerProfile.shema';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationService } from '../notification/notification.service';
import { NotificationType } from '../notification/notificatio.dto';


@Injectable()
export class RatingService {
  constructor(
    @InjectModel(Rating.name) private ratingModel: Model<Rating>,
    @InjectModel(Design.name) private productModel: Model<Design>,
    @InjectModel(Purchase.name) private purchaseModel: Model<Purchase>,
    @InjectModel(DesignerProfile.name) private designerModel: Model<DesignerProfile>,
    private readonly notificationGateway: NotificationGateway,
    private readonly notificationService: NotificationService) {}
   

//  async createRating(userId: string, createRatingDto: CreateRatingDto) {
//     const { productId, rating, review } = createRatingDto;

//     // Check if user purchased the product
//     const purchase = await this.purchaseModel.findOne({ userId: new Types.ObjectId(userId), productId: new Types.ObjectId(productId) });
//     if (!purchase) {
//       throw new ForbiddenException('You must purchase this product before rating');
//     }

//     // Check if already rated
//     const existingRating = await this.ratingModel.findOne({ userId: new Types.ObjectId(userId), productId: new Types.ObjectId(productId) });
//     if (existingRating) {
//       throw new BadRequestException('You have already rated this product. Use update instead.');
//     }

//     // Validate rating value
//     if (rating < 1 || rating > 5) {
//       throw new BadRequestException('Rating must be between 1 and 5');
//     }

//     // Create rating
//     const newRating = await this.ratingModel.create({
//       userId: new Types.ObjectId(userId),
//       productId: new Types.ObjectId(productId),
//       rating,
//       review,
//       hasBeenEdited: false,
//     });

//     // Update product rating statistics
//     await this.updateProductRatingStats(productId);

//     return this.ratingModel
//       .findById(newRating._id)
//       .populate('user', 'name email avatarUrl -_id')
//       .exec();
//   }

//   async updateRating(userId: string, productId: string, updateRatingDto: UpdateRatingDto) {
//     const rating = await this.ratingModel.findOne({ userId: new Types.ObjectId(userId), productId: new Types.ObjectId(productId) });
//     if (!rating) {
//       throw new NotFoundException('Rating not found');
//     }

//     // Check if already edited once
//     if (rating.hasBeenEdited) {
//       throw new ForbiddenException('You can only edit your rating once. This rating has already been edited.');
//     }

//     // Validate rating value if provided
//     if (updateRatingDto.rating !== undefined) {
//       if (updateRatingDto.rating < 1 || updateRatingDto.rating > 5) {
//         throw new BadRequestException('Rating must be between 1 and 5');
//       }
//       rating.rating = updateRatingDto.rating;
//     }

//     if (updateRatingDto.review !== undefined) {
//       rating.review = updateRatingDto.review;
//     }

//     // Mark as edited
//     rating.hasBeenEdited = true;
//     rating.editedAt = new Date();

//     await rating.save();

//     // Update product rating statistics
//     await this.updateProductRatingStats(productId);

//     return this.ratingModel
//       .findById(rating._id)
//       .populate('user', 'name email avatarUrl -_id')
//       .exec();
//   }

//   async deleteRating(userId: string, productId: string) {
//     const rating = await this.ratingModel.findOne({ userId: new Types.ObjectId(userId), productId: new Types.ObjectId(productId) });
//     if (!rating) {
//       throw new NotFoundException('Rating not found');
//     }

//     await rating.deleteOne();

//     // Update product rating statistics
//     await this.updateProductRatingStats(productId);

//     return { message: 'Rating deleted successfully' };
//   }

async createRating(userId: string, createRatingDto: CreateRatingDto) {
    const { productId, rating, review } = createRatingDto;

    const rater = await this.designerModel.findOne({ 
      userId: new Types.ObjectId(userId), 
    });
    if (!rater) {
      throw new NotFoundException('User not found');
    }

    const design = await this.productModel.findById(productId);
    if (!design) {
      throw new NotFoundException('Design not found');
    }


    // Check purchase
    const purchase = await this.purchaseModel.findOne({ 
      userId: new Types.ObjectId(userId), 
      productId: new Types.ObjectId(productId) 
    });
    if (!purchase) {
      throw new ForbiddenException('You must purchase this product before rating');
    }

    

    // Check existing
    const existingRating = await this.ratingModel.findOne({ 
      userId: new Types.ObjectId(userId), 
      productId: new Types.ObjectId(productId) 
    });
    if (existingRating) {
      throw new BadRequestException('You have already rated this product. Use update instead.');
    }

    if (rating < 1 || rating > 5) {
      throw new BadRequestException('Rating must be between 1 and 5');
    }

    const newRating = await this.ratingModel.create({
      userId: new Types.ObjectId(userId),
      productId: new Types.ObjectId(productId),
      rating,
      review,
      hasBeenEdited: false,
    });

    // Cập nhật stats cho cả Product và Designer
    await this.updateRatingStats(productId);

   await this.notificationService.create({
                    userId: design.designerId.toString(),
                    title: `${rater.name} has rated your design`,
                    type: NotificationType.RATING,
                    thumbnail: rater.avatarUrl || '',
                    link: `/detail/${productId}`,
                    relatedEntityId: productId
                  });
        

    return this.ratingModel
      .findById(newRating._id)
      .populate('user', 'name email avatarUrl -_id')
      .exec();
  }

  async updateRating(userId: string, productId: string, updateRatingDto: UpdateRatingDto) {
    
    const rater = await this.designerModel.findOne({ 
      userId: new Types.ObjectId(userId), 
    });
    if (!rater) {
      throw new NotFoundException('User not found');
    }

    const design = await this.productModel.findById(productId);
    if (!design) {
      throw new NotFoundException('Design not found');
    }
    
    const rating = await this.ratingModel.findOne({ 
      userId: new Types.ObjectId(userId), 
      productId: new Types.ObjectId(productId) 
    });
    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    if (rating.hasBeenEdited) {
      throw new ForbiddenException('You can only edit your rating once.');
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

    rating.hasBeenEdited = true;
    rating.editedAt = new Date();

    await rating.save();

    // Cập nhật stats cho cả Product và Designer
    await this.updateRatingStats(productId);

    await this.notificationService.create({
                    userId: design.designerId.toString(),
                    title: `${rater.name} has updated rating on your design`,
                    type: NotificationType.RATING,
                    thumbnail: rater.avatarUrl || '',
                    link: `/detail/${productId}`,
                    relatedEntityId: productId,
                  });
        

    return this.ratingModel
      .findById(rating._id)
      .populate('user', 'name email avatarUrl -_id')
      .exec();
  }

  async deleteRating(userId: string, productId: string) {
    const rating = await this.ratingModel.findOne({ 
      userId: new Types.ObjectId(userId), 
      productId: new Types.ObjectId(productId) 
    });
    if (!rating) {
      throw new NotFoundException('Rating not found');
    }

    await rating.deleteOne();

    // Cập nhật stats cho cả Product và Designer
    await this.updateRatingStats(productId);

    return { message: 'Rating deleted successfully' };
  }

  async getProductRatings(productId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [ratings, total] = await Promise.all([
      this.ratingModel
        .find({ productId: new Types.ObjectId(productId) })
        .populate('user', 'name email avatarUrl -_id')
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
    const rating = await this.ratingModel
      .findOne({ userId: new Types.ObjectId(userId), productId: new Types.ObjectId(productId)})
      .populate('user', 'name email avatarUrl -_id')
      .exec();

    return rating;
  }

  private async updateProductRatingStats(productId: string) {
    const ratings = await this.ratingModel.find({ productId: new Types.ObjectId(productId) }).exec();
    
    if (ratings.length === 0) {
      await this.productModel.findByIdAndUpdate(productId, {
        averageRating: 0,
        ratingCount: 0,
      });
      return;
    }

    const totalRating = ratings.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalRating / ratings.length;

    console.log(averageRating);
    await this.productModel.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10,
      ratingCount: ratings.length,
    });
  }

  // Get rating distribution
  async getRatingDistribution(productId: string) {
    const ratings = await this.ratingModel.find({ productId: new Types.ObjectId(productId) }).exec();
    
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratings.forEach(rating => {
      distribution[rating.rating as keyof typeof distribution]++;
    });

    return {
      distribution,
      total: ratings.length,
      average: ratings.length > 0 
        ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
        : 0,
    };
  }

  private async updateRatingStats(productId: string) {
    const productObjectId = new Types.ObjectId(productId);

    // BƯỚC 1: CẬP NHẬT CHO PRODUCT
    const productRatings = await this.ratingModel.find({ productId: productObjectId }).exec();
    
    let productAvgRating = 0;
    let productRatingCount = 0;

    if (productRatings.length > 0) {
      const sum = productRatings.reduce((acc, r) => acc + r.rating, 0);
      productAvgRating = Math.round((sum / productRatings.length) * 10) / 10;
      productRatingCount = productRatings.length;
    }

    // Cập nhật Product và lấy về document mới nhất để lấy designerId
    const updatedProduct = await this.productModel.findByIdAndUpdate(
      productObjectId,
      {
        averageRating: productAvgRating,
        ratingCount: productRatingCount,
      },
      { new: true } // Trả về document sau khi update
    ).exec();

    if (!updatedProduct) return; // Nếu product bị xóa rồi thì thôi

    // BƯỚC 2: CẬP NHẬT CHO DESIGNER PROFILE
    // Logic: Rating của Designer = Trung bình cộng rating của TẤT CẢ sản phẩm họ có
    // Hoặc = Trung bình cộng của TẤT CẢ các lượt đánh giá họ nhận được (cách này phổ biến hơn)
    
    const designerId = updatedProduct.designerId;
    if (!designerId) return;

    // Tìm tất cả sản phẩm của designer này
    const designerProducts = await this.productModel.find({ designerId: designerId }).select('_id').exec();
    const designerProductIds = designerProducts.map(p => p._id);

    if (designerProductIds.length === 0) return;

    // Aggregate để tính tổng rating và số lượng rating của toàn bộ các sản phẩm thuộc designer này
    const result = await this.ratingModel.aggregate([
      {
        $match: { 
          productId: { $in: designerProductIds } 
        }
      },
      {
        $group: {
          _id: null, // Gom tất cả lại thành 1 nhóm
          totalRatingSum: { $sum: '$rating' },
          count: { $sum: 1 }
        }
      }
    ]);

    let designerAvgRating = 0;
    let designerLikeCount = 0; // Nếu bạn muốn tính likeCount từ rating (ví dụ rating >= 4 là like) hoặc giữ nguyên logic like riêng

    if (result.length > 0) {
      const { totalRatingSum, count } = result[0];
      designerAvgRating = Math.round((totalRatingSum / count) * 10) / 10;
    }

    // Cập nhật vào Designer Profile
    // Lưu ý: userId trong DesignerProfile thường khớp với designerId trong Design
    await this.designerModel.findOneAndUpdate(
      { userId: designerId },
      {
        rating: designerAvgRating,
 
      }
    );
  }

}

