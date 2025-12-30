import { Design } from '@app/database/schemas/design.schema';
import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCollectionDto, CreateDesignDto, DesignDto, GetGalleryItemsDto, GetStoreItemsDto, GetUserDesignsDto, ProductQueryDto, UpdateCollectionDto, UpdateDesignDto, UpdateProductDto } from './product.dto';
import {  Comment } from '@app/database/schemas/comment.schema';
import { Category } from '@app/database/schemas/category.schema';
import { Like } from '@app/database/schemas/like.schema';
import { Following } from '@app/database/schemas/following.schema';
import { DesignerProfile } from '@app/database/schemas/designerProfile.shema';
import { Collection } from '@app/database/schemas/collection.schema';
import { ProductView } from '@app/database/schemas/product-view.schema';
import { StorageService } from '@app/storage';
import { NotificationService } from '../notification/notification.service';
import { NotificationGateway } from '../notification/notification.gateway';
import { NotificationType } from '../notification/notificatio.dto';

export type ModelFile = {
  publicId: string; 

  format: string; 
  
  originalName: string;

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
                private readonly notificationService: NotificationService,
                private readonly notificationGateway: NotificationGateway,
                private readonly storageService: StorageService,



){}
    
    async create(dto: CreateDesignDto, designerId: string, imageUrls: string[], modelFiles: ModelFile[], displayModelUrl: string) {
        
        const design: any = {...dto, 
            designerId: new Types.ObjectId(designerId), 
            categoryId: new Types.ObjectId(dto.categoryId),
            style: dto.style,
            gender: dto.gender,
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
            

        const createdDesign = await this.designModel.create(design);
      await this.designerModel.findOneAndUpdate({userId: new Types.ObjectId(designerId)}, {
        $inc: { totalDesigns: 1 }
      });
        return createdDesign;
    }

    async get(designerId: string) {
        return await this.designModel.find({designerId: new Types.ObjectId(designerId)});
    }

    async getOneById(id: string, userId?: string) {
      
        await this.trackProductView(id, userId);

        const design = await this.designModel
            .findById(id)
            .populate('designerProfile')
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

   async updateOneById(
  id: string, 
  dto: UpdateDesignDto, // Sửa lại tên DTO cho khớp với class bạn khai báo
  newImages: Express.Multer.File[], 
  newModels: Express.Multer.File[]
) {
  const design = await this.designModel.findById(id).exec();
  if (!design) throw new NotFoundException('Design not found');
  if(design.type === "auction" && design.status !== "upcoming")
    throw new BadRequestException('Can only update auction that upcoming');
  // ---------------------------------------------------------
  // 1. XỬ LÝ ẢNH (IMAGES)
  // ---------------------------------------------------------
  
  // Lấy danh sách ảnh cũ user muốn giữ lại (từ DTO)
  const keptImageUrls = dto.oldImages || [];
  
  // Lấy danh sách ảnh hiện có trong DB
  const currentImageUrls = design.imageUrls || [];

  // Tìm các ảnh có trong DB nhưng KHÔNG có trong danh sách giữ lại -> Cần xóa
  const imagesToDelete = currentImageUrls.filter(url => !keptImageUrls.includes(url));

  // Gọi Storage Service để xóa các ảnh này trên Cloud
  if (imagesToDelete.length > 0) {
    await Promise.all(
      imagesToDelete.map(url => this.storageService.deleteFile(this.storageService.getPublicIdFromUrl(url) || "", "image")) // Giả định service có hàm delete nhận URL
    );
    console.log(`Deleted ${imagesToDelete.length} old images`);
  }

  // Upload ảnh mới (nếu có)
  let uploadedImageUrls: string[] = [];
  if (newImages && newImages.length > 0) {
    const imgsRes = await this.storageService.uploadMany(newImages, { 
        folder: 'my_app_images', 
        concurrency: 3 
    });
    // Giả định kết quả trả về là mảng object có thuộc tính .url hoặc .secure_url
    uploadedImageUrls = imgsRes.results.map(img => img.url!); 
    console.log("Uploaded new images");
  }

  // Cập nhật lại danh sách ảnh cuối cùng: [Ảnh cũ giữ lại] + [Ảnh mới upload]
  design.imageUrls = [...keptImageUrls, ...uploadedImageUrls];

  // ---------------------------------------------------------
  // 2. XỬ LÝ 3D MODEL (Ghi đè phần tử 0)
  // ---------------------------------------------------------

  if (newModels && newModels.length > 0) {
    // Nếu có model mới upload -> Tiến hành thay thế
    
    // a. Xóa model cũ (nếu tồn tại)
    if (design.modelFiles && design.modelFiles.length > 0) {
      const oldModelFile = design.modelFiles[0];
      if (oldModelFile && oldModelFile.publicId) {
        await this.storageService.deleteFile(oldModelFile.publicId, "raw");
        console.log("Deleted old model file");
      }
    }

    // b. Upload model mới
    const modelRes = await this.storageService.upload3d(newModels[0], { folder: '3d_models' });
    console.log("Uploaded new model");

    // c. Tạo object ModelFile mới
    const newModelFile: ModelFile = {
      publicId: modelRes.key,
      format: modelRes.format || "",
      originalName: newModels[0].originalname,
      size: modelRes.bytes || 0,
    };

    // d. Ghi đè vào vị trí đầu tiên (index 0) hoặc tạo mảng mới
    // Lưu ý: Schema yêu cầu modelFiles là mảng
    if (!design.modelFiles) {
        design.modelFiles = [newModelFile];
    } else {
        design.modelFiles[0] = newModelFile;
    }
    
    // Cập nhật displayModelUrl luôn nếu cần (thường là link file glb)
    // design.displayModelUrl = modelRes.url || modelRes.secure_url;

  } 
  // Nếu không có newModels, ta giữ nguyên model cũ (không xóa theo oldModels vì model là required)

  // ---------------------------------------------------------
  // 3. CẬP NHẬT CÁC TRƯỜNG THÔNG TIN KHÁC (TEXT)
  // ---------------------------------------------------------
  
  if (dto.title) design.title = dto.title;
  if (dto.description) design.description = dto.description;
  if (dto.categoryId) design.categoryId = new Types.ObjectId(dto.categoryId);
  if (dto.style) design.style = dto.style;
  if (dto.gender) design.gender = dto.gender;
  if (dto.tags) design.tags = dto.tags;

  // Cập nhật giá & thông tin đấu giá tùy theo type
  if (design.type === 'fixed') {
     if (dto.price !== undefined) design.price = dto.price;
  } else if (design.type === 'auction') {
     if (dto.startingPrice !== undefined) design.startingPrice = dto.startingPrice;
     if (dto.bidIncrement !== undefined) design.bidIncrement = dto.bidIncrement;
     if (dto.startTime) design.startTime = dto.startTime;
     if (dto.endTime) design.endTime = dto.endTime;
  }

 
  
  return await design.save();
}

    async getOneCommentsById(id: string) {
        return await this.commentModel.find({designId: new Types.ObjectId(id)});
    }

    async getCategories() {
        return await this.categoryModel.find({isDeleted: false});
    }

    async getPurchasedHistory(designerId: string) {
        
    }

//     async getGalleryItems(filters: GetGalleryItemsDto, userId?: string){

//         const { categorySlug, style, gender, search, page = 1 } = filters;
//   const limit = 20;
//   const skip = (page - 1) * limit;

//   // 1. Khởi tạo Query cơ bản
//   const query: any = { isDeleted: false, type: "gallery" };

//   // 2. Xử lý Category
//   if (categorySlug) {
//     const category = await this.categoryModel.findOne({ slug: categorySlug });
//     if (category) {
//       query.categoryId = category._id;
//     } else {
//       return { data: [], total: 0, page, lastPage: 0 };
//     }
//   }

//   // 3. Các bộ lọc khác
//   if (gender) query.gender = gender;
//   if (style) query.style = style;

//   // 4. Tìm kiếm text
//   if (search) {
// query.title = { $regex: search, $options: 'i' };  }

//   // 5. Xử lý Sort
//   const sortOption: any = {};
  
//     sortOption.createdAt = -1;


//   // 6. Execute Query
//   const [products, total] = await Promise.all([
//     this.designModel
//       .find(query)
//       .sort(sortOption)
//       .skip(skip)
//       .limit(limit)
//       .populate('designerProfile', 'name email -_id')
//       // .populate('category', 'name slug')
//       .lean() // QUAN TRỌNG: Chuyển về Plain Javascript Object để có thể gán isLiked
//       .exec(),
//     this.designModel.countDocuments(query),
//   ]);

//   // 7. Xử lý logic isLiked
//   let resultData = products;

//   if (userId) {
//     // A. Lấy danh sách ID của các sản phẩm trên trang hiện tại
//     const productIds = products.map((p) => p._id);

//     // B. Tìm xem User đã like cái nào trong danh sách productIds này chưa
//     // (Tối ưu hơn việc query tất cả like của user)
//     const userLikes = await this.likeModel
//       .find({
//         viewerId: new Types.ObjectId(userId), // Đảm bảo userId là ObjectId
//         designId: { $in: productIds },       // Chỉ tìm trong phạm vi trang hiện tại
//       })
//       .select('designId') // Chỉ cần lấy designId
//       .lean();

//     // C. Tạo Set để tra cứu cho nhanh (O(1))
//     // Convert ObjectId sang String để so sánh chuẩn xác
//     const likedSet = new Set(userLikes.map((like) => like.designId.toString()));

//     // D. Map lại data để thêm trường isLiked
//     resultData = products.map((product) => ({
//       ...product,
//       isLiked: likedSet.has(product._id.toString()), // True nếu tồn tại trong Set, False nếu không
//     }));
//   } else {
//     // Nếu chưa đăng nhập, mặc định isLiked = false hết
//     resultData = products.map((product) => ({
//       ...product,
//       isLiked: false,
//     }));
//   }

//   // 8. Trả về kết quả
//   return {
//     data: resultData,
//     total,
//     page: Number(page),
//     lastPage: Math.ceil(total / limit),
//   };
    
        
//     }

// Trong product.service.ts

async getGalleryItems(filters: GetGalleryItemsDto, userId?: string) {
    const { categorySlug, style, gender, search, page = 1 } = filters;
    const limit = 20;
    const pageNumber = Number(page); // Đảm bảo là số
    const skip = (pageNumber - 1) * limit;

    // 1. Khởi tạo Query cơ bản
    const query: any = { isDeleted: false, type: "gallery" };

    // 2. Xử lý Category
    if (categorySlug) {
        const category = await this.categoryModel.findOne({ slug: categorySlug });
        if (category) {
            query.categoryId = category._id;
        } else {
            // Trả về structure rỗng đúng chuẩn nếu không tìm thấy category
            return {
                data: [],
                meta: {
                    total: 0,
                    page: pageNumber,
                    limit,
                    lastPage: 0,
                    hasNextPage: false,
                    hasPrevPage: false
                }
            };
        }
    }

    // 3. Các bộ lọc khác
    if (gender) query.gender = gender;
    if (style) query.style = style;

    // 4. Tìm kiếm text
    if (search) {
        query.title = { $regex: search, $options: 'i' };
    }

    // 5. Xử lý Sort (Mặc định mới nhất)
    const sortOption: any = { createdAt: -1 };

    // 6. Execute Query
    const [products, total] = await Promise.all([
        this.designModel
            .find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .populate('designerProfile', 'name email -_id')
            .lean() // QUAN TRỌNG: Chuyển về Plain Object
            .exec(),
        this.designModel.countDocuments(query),
    ]);

    // 7. Xử lý logic isLiked
    let resultData = products;

    if (userId) {
        const productIds = products.map((p) => p._id);

        const userLikes = await this.likeModel
            .find({
                viewerId: new Types.ObjectId(userId),
                designId: { $in: productIds },
            })
            .select('designId')
            .lean();

        const likedSet = new Set(userLikes.map((like) => like.designId.toString()));

        resultData = products.map((product) => ({
            ...product,
            isLiked: likedSet.has(product._id.toString()),
        }));
    } else {
        resultData = products.map((product) => ({
            ...product,
            isLiked: false,
        }));
    }

    // 8. Trả về kết quả với cấu trúc Meta cho Pagination
    const lastPage = Math.ceil(total / limit);

    return {
        data: resultData,
        meta: {
            total,
            page: pageNumber,
            limit,
            lastPage,
            hasNextPage: pageNumber < lastPage,
            hasPrevPage: pageNumber > 1,
        },
    };
}

//     async getStoreItems(filters: GetStoreItemsDto, userId?: string){

//     const { categorySlug, style, gender, sortPrice, search, page = 1 } = filters;
//   const limit = 20;
//   const skip = (page - 1) * limit;

//   // 1. Khởi tạo Query cơ bản
//   const query: any = { isDeleted: false, type: "fixed" };

//   // 2. Xử lý Category
//   if (categorySlug) {
//     const category = await this.categoryModel.findOne({ slug: categorySlug });
//     if (category) {
//       query.categoryId = category._id;
//     } else {
//       return { data: [], total: 0, page, lastPage: 0 };
//     }
//   }

//   // 3. Các bộ lọc khác
//   if (gender) query.gender = gender;
//   if (style) query.style = style;

//   // 4. Tìm kiếm text
//   if (search) {
// query.title = { $regex: search, $options: 'i' };  }

//   // 5. Xử lý Sort
//   const sortOption: any = {};
//   if (sortPrice) {
//     sortOption.price = sortPrice === 'highest' ? -1 : 1;
//   } else {
//     sortOption.createdAt = -1;
//   }
//   // 6. Execute Query
//   const [products, total] = await Promise.all([
//     this.designModel
//       .find(query)
//       .sort(sortOption)
//       .skip(skip)
//       .limit(limit)
//       .populate('designerProfile', 'name email -_id')
//       // .populate('category', 'name slug')
//       .lean() // QUAN TRỌNG: Chuyển về Plain Javascript Object để có thể gán isLiked
//       .exec(),
//     this.designModel.countDocuments(query),
//   ]);

//   // 7. Xử lý logic isLiked
//   let resultData = products;

//   if (userId) {
//     // A. Lấy danh sách ID của các sản phẩm trên trang hiện tại
//     const productIds = products.map((p) => p._id);

//     // B. Tìm xem User đã like cái nào trong danh sách productIds này chưa
//     // (Tối ưu hơn việc query tất cả like của user)
//     const userLikes = await this.likeModel
//       .find({
//         viewerId: new Types.ObjectId(userId), // Đảm bảo userId là ObjectId
//         designId: { $in: productIds },       // Chỉ tìm trong phạm vi trang hiện tại
//       })
//       .select('designId') // Chỉ cần lấy designId
//       .lean();

//     // C. Tạo Set để tra cứu cho nhanh (O(1))
//     // Convert ObjectId sang String để so sánh chuẩn xác
//     const likedSet = new Set(userLikes.map((like) => like.designId.toString()));

//     // D. Map lại data để thêm trường isLiked
//     resultData = products.map((product) => ({
//       ...product,
//       isLiked: likedSet.has(product._id.toString()), // True nếu tồn tại trong Set, False nếu không
//     }));
//   } else {
//     // Nếu chưa đăng nhập, mặc định isLiked = false hết
//     resultData = products.map((product) => ({
//       ...product,
//       isLiked: false,
//     }));
//   }

//   // 8. Trả về kết quả
//   return {
//     data: resultData,
//     total,
//     page: Number(page),
//     lastPage: Math.ceil(total / limit),
//   };
    

//         // const designs = await this.designModel.find({type: "fixed", isDeleted: false})
//         //     .sort({createdAt: - 1})
//         //     .limit(20)
//         //     .populate({
//         //         path: 'designerProfile',
//         //         select: 'name email -_id'
//         //     })
//         //     .lean()
//         //     .exec();
        
//         // if (!userId) return designs;

//         // const likes = await this.likeModel.find({viewerId: new Types.ObjectId(userId)})
//         //     .select('designId -_id')
//         //     .lean()
//         //     .exec();

//         // return designs.map(design => ({
//         //     ...design.toJSON(),
//         //     isLiked: likes.some(like => like.designId.toString() === design._id.toString())
//         // }));
        
//     }

async getStoreItems(filters: GetStoreItemsDto, userId?: string) {
    const { categorySlug, style, gender, sortPrice, search, page = 1 } = filters;
    const limit = 20; // Có thể đưa limit vào filters để linh hoạt hơn
    const pageNumber = Number(page); // Đảm bảo là số
    const skip = (pageNumber - 1) * limit;

    // 1. Khởi tạo Query cơ bản
    const query: any = { isDeleted: false, type: "fixed" };

     // 2. Xử lý Category
  if (categorySlug) {
    const category = await this.categoryModel.findOne({ slug: categorySlug });
    if (category) {
      query.categoryId = category._id;
    } else {
      return { data: [], total: 0, page, lastPage: 0 };
    }
  }

  // 3. Các bộ lọc khác
  if (gender) query.gender = gender;
  if (style) query.style = style;

  // 4. Tìm kiếm text
  if (search) {
query.title = { $regex: search, $options: 'i' };  }

    // 5. Xử lý Sort
    const sortOption: any = {};
    if (sortPrice) {
        sortOption.price = sortPrice === 'highest' ? -1 : 1;
    } else {
        sortOption.createdAt = -1;
    }

    // 6. Execute Query
    const [products, total] = await Promise.all([
        this.designModel
            .find(query)
            .sort(sortOption)
            .skip(skip)
            .limit(limit)
            .populate('designerProfile', 'name email -_id')
            .lean()
            .exec(),
        this.designModel.countDocuments(query),
    ]);

    // 7. Xử lý logic isLiked (Giữ nguyên logic tối ưu của bạn)
    let resultData = products;
    if (userId) {
        const productIds = products.map((p) => p._id);
        const userLikes = await this.likeModel
            .find({
                viewerId: new Types.ObjectId(userId),
                designId: { $in: productIds },
            })
            .select('designId')
            .lean();

        const likedSet = new Set(userLikes.map((like) => like.designId.toString()));
        resultData = products.map((product) => ({
            ...product,
            isLiked: likedSet.has(product._id.toString()),
        }));
    } else {
        resultData = products.map((product) => ({
            ...product,
            isLiked: false,
        }));
    }

    // 8. Trả về kết quả (Cập nhật cấu trúc meta cho đầy đủ)
    const lastPage = Math.ceil(total / limit);
    return {
        data: resultData,
        meta: {
            total,
            page: pageNumber,
            limit,
            lastPage, // Tổng số trang
            hasNextPage: pageNumber < lastPage,
            hasPrevPage: pageNumber > 1
        }
    };
}
    async likeDesign(userId: string, designId: string) {

        const design = await this.designModel.findById(designId).exec();

        if (!design) throw new NotFoundException('Product not found');

        const viewer = await this.designerModel.findOne({userId: new Types.ObjectId(userId)}).exec();

        if (!viewer) throw new NotFoundException('User not found');

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
          await this.designerModel.findOneAndUpdate({userId: new Types.ObjectId(design.designerId)}, {
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

            await this.designerModel.findOneAndUpdate({userId: new Types.ObjectId(design.designerId)}, {
        $inc: { likeCount: 1 }
      });
          await this.notificationService.create({
            userId: design.designerId.toString(),
            title: `${viewer.name} like your design`,
            type: NotificationType.LIKE,
            thumbnail: viewer.avatarUrl || '',
            link: `/detail/${designId}`,
            relatedEntityId: designId,
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

    const follower = await this.designerModel.findOne({userId: new Types.ObjectId(userId)});
    if (!follower) throw new NotFoundException('Follower not found');

    const following = await this.followingModel.findOne({
        designerId: new Types.ObjectId(designerId), 
        followerId: new Types.ObjectId(userId)
    })

    if (following) {
      // Unfollow

      await this.followingModel.deleteOne({designerId: new Types.ObjectId(designerId), followerId: new Types.ObjectId(userId)});

      await this.designerModel.findOneAndUpdate({userId: new Types.ObjectId(userId)}, {
        $inc: { followingCount: -1 }
      });

      await this.designerModel.findOneAndUpdate({userId: new Types.ObjectId(designerId)}, {
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

        await this.notificationService.create({
            userId: userId,
            title: `${follower.name} follow you`,
            type: NotificationType.FOLLOW,
            thumbnail: follower.avatarUrl || '',
            link: `/portfolio/${follower.userId.toString()}`,
            relatedEntityId: follower.userId.toString(),
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

  private checkDeletePermissions(design: Design) {
    if (design.type === 'auction') {
      if (design.status === 'active') {
        throw new ForbiddenException('Cannot delete active auctions. Please cancel first.');
      }
      // if (design.status === 'ended' && design.currentWinnerId) {
      //   throw new ForbiddenException('Cannot delete auctions with winners');
      // }
    }
    // Gallery and fixed types can always be deleted
  }


 async deleteProduct(userId: string, designId: string) {
    const design = await this.designModel.findOne({ _id: new Types.ObjectId(designId), isDeleted: false });
    if (!design) throw new NotFoundException('Design not found');
    if (design.designerId.toString() !== userId) {
      throw new ForbiddenException('You can only delete your own designs');
    }

    // Check delete permissions
    this.checkDeletePermissions(design);

    // Soft delete
    design.isDeleted = true;
    design.deletedAt = new Date();
    design.deletedBy = new Types.ObjectId(userId);
    await design.save();

    // Remove from all collections
    // await this.collectionModel.updateMany(
    //   { productIds: design._id },
    //   { $pull: { productIds: design._id } }
    // );
    await this.designerModel.findOneAndUpdate({userId: new Types.ObjectId(userId)}, {
        $inc: { totalDesigns: -1 }
      });
    return { message: 'Design deleted successfully' };
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
        // .populate('collectionId', 'name')
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

  // async getMyProducts(userId: string, query: any) {
  //   const { page = 1, limit = 10, sortBy = 'createdAt', sortOrder = 'desc', search, status } = query;
    
  //   const filter: any = { designerId: new Types.ObjectId(userId), isDeleted: false};
  //   if (search) {
  //     filter.$or = [
  //       { name: { $regex: search, $options: 'i' } },
  //       { description: { $regex: search, $options: 'i' } },
  //     ];
  //   }
  //   // if (collectionId) filter.collectionId = collectionId;
  //   if (status) filter.status = status;

  //   const skip = (page - 1) * limit;
  //   const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

  //   const [products, total] = await Promise.all([
  //     this.designModel
  //       .find(filter)
  //       // .populate('collectionId', 'name')
  //       .sort(sortOptions)
  //       .skip(skip)
  //       .limit(limit)
  //       .exec(),
  //     this.designModel.countDocuments(filter),
  //   ]);

  //   return {
  //     products,
  //     total,
  //     page,
  //     limit,
  //     totalPages: Math.ceil(total / limit),
  //   };
  // }
async getMyProducts(userId: string, query: any) {
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc', 
      search, 
      status, 
      type // Thêm tham số type
    } = query;

    // 1. Base Filter
    const filter: any = { 
      designerId: new Types.ObjectId(userId), 
      isDeleted: false 
    };

    // 2. Search (Tìm theo title hoặc description)
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } }, // Schema dùng 'title', ko phải 'name'
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // 3. Filter by Type
    if (type && type !== 'all') {
      filter.type = type;
    }

    // 4. Filter by Status (Chỉ áp dụng cho Auction hoặc logic chung tùy bạn)
    if (status && status !== 'all') {
      filter.status = status;
    }

    // 5. Pagination & Sorting
    const pageNumber = Number(page);
    const limitNumber = Number(limit);
    const skip = (pageNumber - 1) * limitNumber;
    
    // Sort options: { field: 1 | -1 }
    const sortOptions: any = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [products, total] = await Promise.all([
      this.designModel
        .find(filter)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNumber)
        // .populate('collectionId', 'name') // Uncomment nếu cần
        .exec(),
      this.designModel.countDocuments(filter),
    ]);

    return {
      data: products,
      meta: {
        total,
        page: pageNumber,
        limit: limitNumber,
        totalPages: Math.ceil(total / limitNumber),
      },
    };
  }

  async findAllByDesigner(designerId: string, query: GetUserDesignsDto, userId?: string) {
    const { type, page = 1, limit = 12 } = query;
    const skip = (page - 1) * limit;

    // 1. Tạo filter cơ bản
    const filter: any = {
      designerId: new Types.ObjectId(designerId),
      isDeleted: false, // Chỉ lấy item chưa bị xóa
      state: 'approved', // (Tuỳ chọn) Chỉ lấy item đã duyệt
    };

    // 2. Nếu có type thì thêm vào filter
    if (type) {
      filter.type = type;
    }

    // 3. Thực hiện query song song: Lấy data và đếm tổng số
    const [products, total] = await Promise.all([
      this.designModel
        .find(filter)
      .populate('designerProfile', 'name email -_id')
        .sort({ createdAt: -1 }) // Mới nhất lên đầu
        .skip(skip)
        .limit(limit)
        .lean() // Chuyển về Plain Javascript Object để có thể gán isLiked
        .exec(),
      this.designModel.countDocuments(filter).exec(),
    ]);

    // 7. Xử lý logic isLiked
  let resultData = products;

  if (userId) {
    // A. Lấy danh sách ID của các sản phẩm trên trang hiện tại
    const productIds = products.map((p) => p._id);

    // B. Tìm xem User đã like cái nào trong danh sách productIds này chưa
    // (Tối ưu hơn việc query tất cả like của user)
    const userLikes = await this.likeModel
      .find({
        viewerId: new Types.ObjectId(userId), // Đảm bảo userId là ObjectId
        designId: { $in: productIds },       // Chỉ tìm trong phạm vi trang hiện tại
      })
      .select('designId') // Chỉ cần lấy designId
      .lean();

    // C. Tạo Set để tra cứu cho nhanh (O(1))
    // Convert ObjectId sang String để so sánh chuẩn xác
    const likedSet = new Set(userLikes.map((like) => like.designId.toString()));

    // D. Map lại data để thêm trường isLiked
    resultData = products.map((product) => ({
      ...product,
      isLiked: likedSet.has(product._id.toString()), // True nếu tồn tại trong Set, False nếu không
    }));
  } else {
    // Nếu chưa đăng nhập, mặc định isLiked = false hết
    resultData = products.map((product) => ({
      ...product,
      isLiked: false,
    }));
  }

    // 4. Tính toán metadata phân trang
    const totalPages = Math.ceil(total / limit);

    return {
      data: resultData,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }


async findAllDesignerLikedModels(designerId: string, query: GetUserDesignsDto, viewerId?: string) {
    const { page = 1, limit = 12 } = query;
    const skip = (page - 1) * limit;

    // 1. Tìm các lượt like của Designer này
    const filter = { viewerId: new Types.ObjectId(designerId) };

    // 2. Query song song: Lấy danh sách Like (populate Design) và đếm tổng
    const [likes, total] = await Promise.all([
      this.likeModel
        .find(filter)
        .sort({ createdAt: -1 }) // Like mới nhất lên đầu
        .skip(skip)
        .limit(limit)
        .populate({
          path: 'designId',
          match: { isDeleted: false, state: 'approved' }, // Chỉ lấy design còn tồn tại và đã duyệt
          populate: { path: 'designerProfile', select: 'name avatarUrl' } // Lấy thông tin người tạo ra design đó
        })
        .lean()
        .exec(),
      this.likeModel.countDocuments(filter).exec(),
    ]);

    // 3. Lọc ra danh sách products (loại bỏ các item null do match ở populate)
    let products = likes
      .map((like: any) => like.designId)
      .filter((product) => product !== null);

    // 4. Xử lý logic isLiked (Kiểm tra xem Viewer hiện tại có like các design này không)
    let resultData = products;

    if (viewerId) {
      const productIds = products.map((p) => p._id);

      const userLikes = await this.likeModel
        .find({
          viewerId: new Types.ObjectId(viewerId),
          designId: { $in: productIds },
        })
        .select('designId')
        .lean();

      const likedSet = new Set(userLikes.map((like) => like.designId.toString()));

      resultData = products.map((product) => ({
        ...product,
        isLiked: likedSet.has(product._id.toString()),
      }));
    } else {
      resultData = products.map((product) => ({
        ...product,
        isLiked: false,
      }));
    }

    // 5. Metadata phân trang
    const totalPages = Math.ceil(total / limit);

    return {
      data: resultData, // Trả về key là 'data' để thống nhất với Frontend
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
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

  async getFollowingList(userId: string, query: any) {
    const { page = 1, limit = 12 } = query;
    const skip = (page - 1) * limit;

    const filter = { followerId: new Types.ObjectId(userId) };

    const [data, total] = await Promise.all([
        this.followingModel
            .find(filter)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            // Populate virtual field 'designerProfile'
            .populate({
                path: 'designerProfile',
                select: 'name avatarUrl bio profession' // Chỉ lấy các trường cần thiết
            })
            .lean()
            .exec(),
        this.followingModel.countDocuments(filter).exec()
    ]);

    // Lọc bỏ những record không có profile (trường hợp user đã xóa acc)
    const validData = data.filter((item: any) => item.designerProfile);

    const totalPages = Math.ceil(total / limit);

    return {
        data: validData,
        meta: {
            total,
            page,
            limit,
            totalPages,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1,
        },
    };
}

  async trackProductView(productId: string, userId?: string, ipAddress?: string, userAgent?: string) {
    try {
       const design = await this.designModel.findById(productId);
      if(design) {
        await this.productViewModel.create({
        productId: new Types.ObjectId(productId),
        userId: userId ? new Types.ObjectId(userId) : undefined,
        ipAddress,
        userAgent,
        viewedAt: new Date(),
      });
        design.viewCount ++;
        await design.save();
              return { viewed: true };
      }
      return { viewed: false, message: 'Design not found' };

    } catch (error: any) {
      if (error.code === 11000) {
        return { viewed: false, message: 'Already viewed recently' };
      }
      throw error;
    }
  }

  async getLikesByDesignId(designId: string) {
    const likes = await this.likeModel
      .find({ designId: new Types.ObjectId(designId) })
      .populate('viewerProfile', 'name avatarUrl bio userId') // Populate user profile info
      .lean();

    // Map to return a clean list of profiles
    return likes.map(like => like.viewerProfile).filter(profile => profile !== null);
  }

}
