import { Design } from '@app/database/schemas/design.schema';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateDesignDto, DesignDto } from './product.dto';
import {  Comment } from '@app/database/schemas/comment.schema';
import { Category } from '@app/database/schemas/category.schema';
import { Like } from '@app/database/schemas/like.schema';
import { Following } from '@app/database/schemas/following.schema';
import { DesignerProfile } from '@app/database/schemas/designerProfile.shema';

@Injectable()
export class ProductService {

    constructor(
                @InjectModel(Design.name) private readonly designModel: Model<Design>,
                @InjectModel(DesignerProfile.name) private readonly designerModel: Model<DesignerProfile>,
                @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
                @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
                @InjectModel(Like.name) private readonly likeModel: Model<Like>,
                @InjectModel(Following.name) private readonly followingModel: Model<Following>,


){}
    
    async create(dto: CreateDesignDto, designerId: string, imageUrls: string[], modelUrls: string[], displayModelUrl: string) {
        
        const design: any = {...dto, 
            designerId: new Types.ObjectId(designerId), 
            imageUrls, 
            modelUrls,
            displayModelUrl,
            viewCount: 0, 
            likeCount: 0, 
            state: 'approved'}
        if(dto.type === "auction")
        {
            design.currentPrice = dto.startingPrice || 0;
            design.status = new Date(dto.startTime || "") > new Date() 
            ? 'upcoming' 
            : 'active'
        }
            

        return this.designModel.create(design);
    }

    async get(designerId: string) {
        return await this.designModel.find({designerId: new Types.ObjectId(designerId)});
    }

    async getOneById(id: string, userId?: string) {
        const design = await this.designModel
            .findById(id)
            .populate({
                path: 'designerProfile',
                select: 'name email -_id'
            })
            .exec();

        if (!design) throw new NotFoundException('Product not found');

        if (!userId) return design;

        const like = await this.likeModel.findOne({
            designId: new Types.ObjectId(id),
            viewerId: new Types.ObjectId(userId)
        });
        const following = await this.followingModel.findOne({
            designerId: new Types.ObjectId(design.designerId), 
            followerId: new Types.ObjectId(userId)
        });

        return {
          ...design.toJSON(),
          isLiked: like ? true : false,
          isDesignerFollowed: following ? true : false,
        };
    }

    async updateOneById(id: string, dto: DesignDto) {
        return await this.designModel.findOneAndUpdate({id: new Types.ObjectId(id)}, {...dto}, {new: true});
    }

    async getOneCommentsById(id: string) {
        return await this.commentModel.find({designId: new Types.ObjectId(id)});
    }

    async getCategories() {
        return await this.categoryModel.find();
    }

    async getPurchasedHistory(designerId: string) {
        
    }

    async getGalleryItems(userId?: string){

        const designs = await this.designModel.find({type: "gallery"})
            .sort({createdAt: - 1})
            .limit(20)
            .populate({
                path: 'designerProfile',
                select: 'name email -_id'
            })
            .lean()
            .exec();
        
        if (!userId) return designs;

        const likes = await this.likeModel.find({viewerId: new Types.ObjectId(userId)})
            .select('designId -_id')
            .lean()
            .exec();

        return designs.map(design => ({
            ...design.toJSON(),
            isLiked: likes.some(like => like.designId.toString() === design._id.toString())
        }));
        
    }

    async getStoreItems(userId?: string){

        const designs = await this.designModel.find({type: "fixed"})
            .sort({createdAt: - 1})
            .limit(20)
            .populate({
                path: 'designerProfile',
                select: 'name email -_id'
            })
            .lean()
            .exec();
        
        if (!userId) return designs;

        const likes = await this.likeModel.find({viewerId: new Types.ObjectId(userId)})
            .select('designId -_id')
            .lean()
            .exec();

        return designs.map(design => ({
            ...design.toJSON(),
            isLiked: likes.some(like => like.designId.toString() === design._id.toString())
        }));
        
    }

    async likeDesign(userId: string, designId: string) {

        const design = await this.designModel.findById(designId);

        if (!design) throw new NotFoundException('Product not found');

        const like = await this.likeModel.findOne({
           designId: new Types.ObjectId(designId),
            viewerId: new Types.ObjectId(userId)
        }).exec();

        if (like) {
          // Unlike
          await this.likeModel.deleteOne({viewerId: new Types.ObjectId(userId), designId: new Types.ObjectId(designId)});

          await this.designModel.findByIdAndUpdate(designId, {
            $inc: { likeCount: -1 }
          });

          return { liked: false, message: 'Product unliked' };
        } else {
          // Like
          await this.likeModel.create(
            {
                designId: new Types.ObjectId(designId),
                viewerId: new Types.ObjectId(userId)
            }
          )

          await this.designModel.findByIdAndUpdate(designId, {
            $inc: { likeCount: 1 }
          });

          return { liked: true, message: 'Product liked' };
        }
    }

    async getLikedDesigns(userId: string) {
        
        const likedProducts = await this.likeModel.find({viewerId: new Types.ObjectId(userId)})
                                            .sort({createdAt: - 1})
                                            .limit(20)
                                            .populate('designId')
                                            .exec();

        return likedProducts.map(likedProduct => ({
            ...likedProduct.designId
        }))
    }

  async followDesigner(userId: string, designerId: string) {

    const designer = await this.designerModel.findOne({userId: new Types.ObjectId(designerId)});
    if (!designer) throw new NotFoundException('Designer not found');

    const following = await this.followingModel.findOne({
        designerId: new Types.ObjectId(designerId), 
        followerId: new Types.ObjectId(userId)
    })

    if (following) {
      // Unfollow

      await this.followingModel.deleteOne({designerId: new Types.ObjectId(designerId), followerId: new Types.ObjectId(userId)});

      await this.designerModel.findByIdAndUpdate(userId, {
        $inc: { followingCount: -1 }
      });

      await this.designerModel.findByIdAndUpdate(designerId, {
        $inc: { followerCount: -1 }
      });

      return { followed: false, message: 'Designer unfollowed' };

    } else {
      // Follow
        await this.followingModel.create({
            designerId: new Types.ObjectId(designerId), 
            followerId: new Types.ObjectId(userId)
        });

      await this.designerModel.findOneAndUpdate({userId: new Types.ObjectId(userId)}, {
        $inc: { followingCount: 1 }
      });

      await this.designerModel.findOneAndUpdate({userId: new Types.ObjectId(designerId)}, {
        $inc: { followerCount: 1 }
      });

      return { followed: true, message: 'Designer followed' };
    }
  }


  async getFollowedDesigners(userId: string) {

    const followedDesigners = await this.followingModel.find({followerId: new Types.ObjectId(userId)})
                                                .sort({createdAt: - 1})
                                                .limit(20)
                                                .populate({
                                                    path: 'designerProfile',
                                                    select: 'name email avatarUrl -_id'
                                                })
                                                .exec();


    return followedDesigners;
  }

}
