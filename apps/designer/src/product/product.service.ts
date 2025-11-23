import { Design } from '@app/database/schemas/design.schema';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCollectionDto, CreateDesignDto, DesignDto, ProductQueryDto, UpdateCollectionDto, UpdateProductDto } from './product.dto';
import {  Comment } from '@app/database/schemas/comment.schema';
import { Category } from '@app/database/schemas/category.schema';
import { Like } from '@app/database/schemas/like.schema';
import { Following } from '@app/database/schemas/following.schema';
import { DesignerProfile } from '@app/database/schemas/designerProfile.shema';
import { Collection } from '@app/database/schemas/collection.schema';
import { ProductView } from '@app/database/schemas/product-view.schema';

export type ModelFile = {
  publicId: string; 

  format: string;   

  size: number; 
}

@Injectable()
export class ProductService {

    constructor(
                @InjectModel(Design.name) private readonly designModel: Model<Design>,
                @InjectModel(DesignerProfile.name) private readonly designerModel: Model<DesignerProfile>,
                @InjectModel(Comment.name) private readonly commentModel: Model<Comment>,
                @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
                @InjectModel(Like.name) private readonly likeModel: Model<Like>,
                @InjectModel(Following.name) private readonly followingModel: Model<Following>,
                @InjectModel(Collection.name) private readonly collectionModel: Model<Collection>,
                @InjectModel(ProductView.name) private readonly productViewModel: Model<ProductView>,



){}
    
    async create(dto: CreateDesignDto, designerId: string, imageUrls: string[], modelFiles: ModelFile[], displayModelUrl: string) {
        
        const design: any = {...dto, 
            designerId: new Types.ObjectId(designerId), 
            imageUrls, 
            modelFiles,
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
        // const design = await this.designModel
        //     .findById(id)
        //     .populate('designerProfile')
        //     // .exec();
        //     console.log(design);

        const result = await this.designModel.aggregate([
    {
      $match: {
        _id: new Types.ObjectId(id)
      }
    },
    {
      $lookup: {
        from: 'designerProfiles',
        // Dùng biến 'pid' để lưu giá trị designerId từ Design hiện tại
        let: { pid: '$designerId' }, 
        pipeline: [
          // 1. Tìm DesignerProfile có userId khớp với pid
          { 
            $match: { 
              $expr: { $eq: ['$userId', '$$pid'] } 
            } 
          },
          // 2. CHỈ LẤY name và email ngay tại đây
          { 
            $project: { 
              name: 1, 
              email: 1, 
              avatarUrl: 1,
              _id: 0 // Bỏ _id của profile nếu không cần
            } 
          }
        ],
        as: 'designerProfile'
      }
    },
    {
      // Mảng designerProfile lúc này chỉ chứa các object {name, email}
      $unwind: {
        path: '$designerProfile',
        preserveNullAndEmptyArrays: true
      }
    }
    
  ]).exec();
        const design = result[0];
        // console.log(design);
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
          ...design,
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

  async createCollection(userId: string, createCollectionDto: CreateCollectionDto) {
    const collection = await this.collectionModel.create({
      ...createCollectionDto,
      createdBy: userId,
    });
    return collection;
  }

  async updateCollection(userId: string, collectionId: string, updateCollectionDto: UpdateCollectionDto) {
    const collection = await this.collectionModel.findById(collectionId).exec();
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only update your own collections');
    }

    Object.assign(collection, updateCollectionDto);
    await collection.save();
    return collection;
  }

  async deleteCollection(userId: string, collectionId: string) {
    const collection = await this.collectionModel.findById(collectionId);
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.createdBy.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own collections');
    }

    // Remove collection from all products
    await this.designModel.updateMany(
      { collectionId },
      { $unset: { collectionId: 1 } }
    );

    await collection.deleteOne();
    return { message: 'Collection deleted successfully' };
  }

  async getMyCollections(userId: string) {
    const collections = await this.collectionModel
      .find({ createdBy: userId })
      .sort({ createdAt: -1 })
      .exec();

    // Get product count for each collection
    const collectionsWithCount = await Promise.all(
      collections.map(async (collection) => {
        const count = await this.designModel.countDocuments({ collectionId: collection._id });
        return {
          ...collection.toJSON(),
          productCount: count,
        };
      })
    );

    return collectionsWithCount;
  }

  async getCollectionById(collectionId: string) {
    const collection = await this.collectionModel.findById(collectionId).exec();
    if (!collection) throw new NotFoundException('Collection not found');
    return collection;
  }


  // async createProduct(userId: string, createProductDto: CreateProductDto) {
  //   const product = await this.designModel.create({
  //     ...createProductDto,
  //     sellerId: userId,
  //   });
  //   return product;
  // }

  async updateProduct(userId: string, productId: string, updateProductDto: UpdateProductDto) {
    const product = await this.designModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');
    if (product.designerId.toString() !== userId) {
      throw new ForbiddenException('You can only update your own products');
    }

    Object.assign(product, updateProductDto);
    await product.save();
    return product;
  }

  async deleteProduct(userId: string, productId: string) {
    const product = await this.designModel.findById(productId);
    if (!product) throw new NotFoundException('Product not found');
    if (product.designerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own products');
    }

    await product.deleteOne();
    return { message: 'Product deleted successfully' };
  }

  async getProducts(query: ProductQueryDto, userId?: string) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, collectionId, status } = query;
    
    const filter: any = {};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }
    if (collectionId) filter.collectionId = collectionId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      this.designModel
        .find(filter)
        .populate('sellerId', 'name email')
        .populate('collectionId', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.designModel.countDocuments(filter),
    ]);

    // Check like/follow status if user is logged in
    let productsWithStatus = products;
    // if (userId) {
    //   const user = await this.userModel.findById(userId);
    //   productsWithStatus = products.map(product => ({
    //     ...product.toJSON(),
    //     isLiked: user?.likedProducts.some(id => id.toString() === product._id.toString()) || false,
    //     isSellerFollowed: user?.followedSellers.some(id => id.toString() === product.sellerId._id.toString()) || false,
    //   }));
    // }

    return {
      products: productsWithStatus,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getMyProducts(userId: string, query: ProductQueryDto) {
    const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, collectionId, status } = query;
    
    const filter: any = { designerId: new Types.ObjectId(userId)};
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (collectionId) filter.collectionId = collectionId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      this.designModel
        .find(filter)
        // .populate('collectionId', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.designModel.countDocuments(filter),
    ]);

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async getProductById(productId: string, userId?: string) {
    const product = await this.designModel
      .findById(productId)
      .populate('sellerId', 'name email')
      .populate('collectionId', 'name')
      .exec();

    if (!product) throw new NotFoundException('Product not found');

    // Increment views
    await this.designModel.findByIdAndUpdate(productId, { $inc: { views: 1 } });

    if (!userId) return product;

    // const user = await this.userModel.findById(userId);
    
    // return {
    //   ...product.toJSON(),
    //   isLiked: user?.likedProducts.some(id => id.toString() === product._id.toString()) || false,
    //   isSellerFollowed: user?.followedSellers.some(id => id.toString() === product.sellerId._id.toString()) || false,
    // };
  }

  async trackProductView(productId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    try {
      await this.productViewModel.create({
        productId,
        userId: userId ? new Types.ObjectId(userId) : undefined,
        ipAddress,
        userAgent,
        viewedAt: new Date(),
      });

      await this.designModel.findByIdAndUpdate(productId, { $inc: { views: 1 } });
      return { viewed: true };
    } catch (error: any) {
      if (error.code === 11000) {
        return { viewed: false, message: 'Already viewed recently' };
      }
      throw error;
    }
  }

}
