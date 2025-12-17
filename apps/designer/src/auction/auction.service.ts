import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Auction } from '@app/database/schemas/auction.schema';
import { AuctionBid } from '@app/database/schemas/auctionBid.schema';
import { DesignerProfile } from '@app/database/schemas/designerProfile.shema';
import { AuctionGateway } from './auction.gateway';
import { Design } from '@app/database/schemas/design.schema';
import { GetAuctionItemsDto } from './auction.dto';
import { Category } from '@app/database/schemas/category.schema';
import { Like } from '@app/database/schemas/like.schema';
import { OrderService } from '../order/order.service';
import { Following } from '@app/database/schemas/following.schema';

@Injectable()
export class AuctionService {
  constructor(
    @InjectModel(Auction.name) private readonly auctionModel: Model<Auction>,
    @InjectModel(AuctionBid.name) private readonly bidModel: Model<AuctionBid>,
    @InjectModel(Design.name) private readonly designModel: Model<Design>,
    @InjectModel(Like.name) private readonly likeModel: Model<Like>,
    @InjectModel(Following.name) private readonly followingModel: Model<Following>,
    @InjectModel(Category.name) private readonly categoryModel: Model<Category>,
    @InjectConnection() private readonly connection: Connection,

    private readonly auctionGateway: AuctionGateway,
    private readonly orderService: OrderService,
  ) {}

  async createAuction(createDto: any, sellerId: string): Promise<Auction> {
    const auction = new this.auctionModel({
      ...createDto,
      sellerId: new Types.ObjectId(sellerId),
      currentPrice: createDto.startingPrice,
      status: new Date(createDto.startTime) > new Date() 
        ? 'upcoming' 
        : 'active',
    });
    return auction.save();
  }

  // async getAuctions(filters: GetAuctionItemsDto, userId?: string) {

  // const { categorySlug, style, gender, status, sortBy, search, page = 1 } = filters;
  // const limit = 20;
  // const skip = (page - 1) * limit;

  //    // 1. Khởi tạo Query cơ bản
  //     const query: any = { isDeleted: false, type: "auction" };
    
  //     if (status) {
  //     query.status = filters.status;
  //   }

  //     // 2. Xử lý Category
  //     if (categorySlug) {
  //       const category = await this.categoryModel.findOne({ slug: categorySlug });
  //       if (category) {
  //         query.categoryId = category._id;
  //       } else {
  //         return { data: [], total: 0, page, lastPage: 0 };
  //       }
  //     }
    
  //     // 3. Các bộ lọc khác
  //     if (gender) query.gender = gender;
  //     if (style) query.style = style;
    
  //     // 4. Tìm kiếm text
  //     if (search) {
  //   query.title = { $regex: search, $options: 'i' };  }
    
  //     // 5. Xử lý Sort
  //     const sortOption: any = {};
  //     if (sortBy) {
  //       switch (sortBy) {
  //         case 'lowestPrice':
  //         sortOption.currentPrice = 1;
  //         break;
  //         case 'highestPrice':
  //         sortOption.currentPrice = -1;
  //         break;
  //         case 'ending':
  //         sortOption.endTime = 1;
  //         break;
  //         default:
  //         sortOption.createdAt = -1;
  //         break;
  //         }
  //     } else {
  //       sortOption.createdAt = -1;
  //     }
    
  //     // 6. Execute Query
  //     const [products, total] = await Promise.all([
  //       this.designModel
  //         .find(query)
  //         .sort(sortOption)
  //         .skip(skip)
  //         .limit(limit)
  //         .populate('designerProfile', 'name email -_id')
  //         // .populate('category', 'name slug')
  //         .lean() // QUAN TRỌNG: Chuyển về Plain Javascript Object để có thể gán isLiked
  //         .exec(),
  //       this.designModel.countDocuments(query),
  //     ]);
    
  //     // 7. Xử lý logic isLiked
  //     let resultData = products;
    
  //     if (userId) {
  //       // A. Lấy danh sách ID của các sản phẩm trên trang hiện tại
  //       const productIds = products.map((p) => p._id);
    
  //       // B. Tìm xem User đã like cái nào trong danh sách productIds này chưa
  //       // (Tối ưu hơn việc query tất cả like của user)
  //       const userLikes = await this.likeModel
  //         .find({
  //           viewerId: new Types.ObjectId(userId), // Đảm bảo userId là ObjectId
  //           designId: { $in: productIds },       // Chỉ tìm trong phạm vi trang hiện tại
  //         })
  //         .select('designId') // Chỉ cần lấy designId
  //         .lean();
    
  //       // C. Tạo Set để tra cứu cho nhanh (O(1))
  //       // Convert ObjectId sang String để so sánh chuẩn xác
  //       const likedSet = new Set(userLikes.map((like) => like.designId.toString()));
    
  //       // D. Map lại data để thêm trường isLiked
  //       resultData = products.map((product) => ({
  //         ...product,
  //         isLiked: likedSet.has(product._id.toString()), // True nếu tồn tại trong Set, False nếu không
  //       }));
  //     } else {
  //       // Nếu chưa đăng nhập, mặc định isLiked = false hết
  //       resultData = products.map((product) => ({
  //         ...product,
  //         isLiked: false,
  //       }));
  //     }
    
  //     // 8. Trả về kết quả
  //     return {
  //       data: resultData,
  //       total,
  //       page: Number(page),
  //       lastPage: Math.ceil(total / limit),
  //     };
        
    
  //   // if (filters.category) {
  //   //   query['metadata.category'] = filters.category;
  //   // }
  //   // return this.designModel
  //   //       .find(query)
  //   //       .sort({createdAt : -1})
  //   //       .skip(skip)
  //   //       .limit(limit)
  //   //       .exec();
      
  //   // return this.auctionModel
  //   //   .find(query)
  //   //   .sort({ createdAt: -1 })
  //   //   .limit(filters.limit || 20)
  //   //   .exec();
  // }

  // Trong product.service.ts

async getAuctions(filters: GetAuctionItemsDto, userId?: string) {
    const { categorySlug, style, gender, status, sortBy, search, page = 1 } = filters;
    const limit = 20; // Hoặc lấy từ filters
    const pageNumber = Number(page);
    const skip = (pageNumber - 1) * limit;

    // 1. Khởi tạo Query cơ bản
    const query: any = { isDeleted: false, type: "auction" };

    if (status) {
        query.status = status; // filters.status
    }

    // 2. Xử lý Category
    if (categorySlug) {
        const category = await this.categoryModel.findOne({ slug: categorySlug });
        if (category) {
            query.categoryId = category._id;
        } else {
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

    // 5. Xử lý Sort
    const sortOption: any = {};
    if (sortBy) {
        switch (sortBy) {
            case 'lowestPrice':
                sortOption.currentPrice = 1;
                break;
            case 'highestPrice':
                sortOption.currentPrice = -1;
                break;
            case 'ending':
                sortOption.endTime = 1; // Sắp kết thúc trước
                break;
            default:
                sortOption.createdAt = -1;
                break;
        }
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
            .populate('designerProfile', 'name email avatarUrl')
            .lean()
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

    // 8. Trả về kết quả
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

 async getAuctionById(id: string, viewerId?: string) {
  const auction = await this.designModel
    .findByIdAndUpdate(
      id,
      { $inc: { viewCount: 1 } }, 
      { new: true }               
    )
    .populate('designerProfile', 'name email avatarUrl')      // Populate Designer
    .populate('currentWinnerProfile', 'name email avatarUrl') // Populate Winner
    .exec();

  if (!auction) {
    throw new NotFoundException('Auction not found');
  }

  const like = await this.likeModel.findOne({
            designId: new Types.ObjectId(id),
            viewerId: new Types.ObjectId(viewerId)
        });
        const following = await this.followingModel.findOne({
            designerId: new Types.ObjectId(auction.designerId), 
            followerId: new Types.ObjectId(viewerId)
        });

  return {
    ...auction.toJSON(),
    isLiked: like ? true : false,
    isDesignerFollowed: following ? true : false,
  }
}

  async placeBid(auctionId: string, bidderId: string, amount: number): Promise<AuctionBid> {
    const auction = await this.designModel.findById(auctionId);
    
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }

    if (auction.status !== 'active') {
      throw new BadRequestException('Auction is not active');
    }

    if (new Date() > auction.endTime) {
      throw new BadRequestException('Auction has ended');
    }

    if (auction.designerId.toString() === bidderId) {
      throw new BadRequestException('Seller cannot bid on their own auction');
    }

    const minBidAmount = auction.currentPrice + (auction.bidIncrement || 1);
    if (amount < minBidAmount) {
      throw new BadRequestException(`Minimum bid amount is ${minBidAmount}`);
    }

    // Get previous highest bid
    const previousBid = await this.bidModel
      .findOne({ auctionId })
      .sort({ amount: -1 })
      .exec();

    // Create new bid
    const bid = new this.bidModel({
      auctionId: new Types.ObjectId(auctionId),
      bidderId: new Types.ObjectId(bidderId),
      amount,
      previousBidId: previousBid?._id,
    });

    await bid.save();

    // Update auction
    await this.designModel.updateOne(
      { _id: auctionId },
      {
        $set: {
          currentPrice: amount,
          currentWinnerId: new Types.ObjectId(bidderId),
        },
        $inc: { totalBids: 1 },
      }
    );

    this.auctionGateway.broadcastNewBid(auctionId, bid);
    this.auctionGateway.broadcastPriceUpdate(auctionId, amount)
    return bid;
  }

  async getBidHistory(auctionId: string): Promise<AuctionBid[]> {
    return this.bidModel.aggregate([
  { $match: { auctionId: new Types.ObjectId(auctionId) } }, // lọc theo auctionId
  { $sort: { createdAt: -1 } },
  { $limit: 50 },
  {
    $lookup: {
      from: 'designerProfiles',      // tên collection trong DB
      localField: 'bidderId',        // field trong AuctionBid
      foreignField: 'userId',        // field trong DesignerProfile
      as: 'bidderProfile'            // kết quả join sẽ nằm ở field này
    }
  },
  { $unwind: '$bidderProfile' },     // convert array thành object (1:1)
  { $project: {
      amount: 1,
      isAutoBid: 1,
      createdAt: 1,
      bidderProfile: { 
        name: 1,
        userId: 1,
        avatarUrl: 1, 
      }    // chỉ lấy name của bidder
    }
  }
]);
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async updateAuctionStatuses() {
    const now = new Date();

    // Start upcoming auctions
    await this.designModel.updateMany(
      {
        type: "auction",
        status: 'upcoming',
        startTime: { $lte: now },
      },
      { $set: { status: 'active' } }
    );

    // End active auctions
    // await this.designModel.updateMany(
    //   {
    //     type: "auction",
    //     status: 'active',
    //     endTime: { $lte: now },
    //   },
    //   { $set: { status: 'ended' } }
    // );

    await this.endActiveAuctions();
  }

  async endActiveAuctions() {
const now = new Date();

  // BƯỚC 1: Tìm danh sách ID cần xử lý TRƯỚC (Không dùng transaction ở đây)
  // Việc này giúp tránh giữ lock trên collection quá lâu khi đang tìm kiếm
  const expiredAuctions = await this.designModel.find({
    type: 'auction',
    status: 'active',
    endTime: { $lte: now },
  }).select('_id'); // Chỉ cần lấy _id để tiết kiệm bộ nhớ

  // BƯỚC 2: Loop và xử lý từng cái trong transaction riêng biệt
  for (const auctionPlain of expiredAuctions) {
    await this.processSingleAuctionEnd(auctionPlain._id);
  }
}

// Hàm xử lý riêng cho từng Auction (Helper function)
private async processSingleAuctionEnd(auctionId: any) {
  const session = await this.connection.startSession();
  try {
    session.startTransaction();

    // A. Query lại document bên trong session để lấy bản mới nhất và LOCK nó
    // Thêm điều kiện status: 'active' để đảm bảo không xử lý trùng lặp (Concurrency control)
    const auction = await this.designModel.findOne({
      _id: auctionId,
      status: 'active' 
    }).session(session);

    // Nếu không tìm thấy (có thể đã bị job khác xử lý xong), thì bỏ qua
    if (!auction) {
      await session.abortTransaction();
      return;
    }

    // B. Tạo Order
    if (auction.currentWinnerId) {
      // QUAN TRỌNG: Bạn NÊN truyền session vào createAuctionOrder 
      // để nếu tạo order lỗi thì auction không bị đóng
      await this.orderService.createAuctionOrder(
          auction.currentWinnerId.toString(), 
          (auction._id as any).toString(),
          "paypal",
          session 
          // session // <-- Hãy uncomment và sửa service order nhận session
      );
    }

    // C. Update status
    await this.designModel.updateOne(
      { _id: auction._id },
      { $set: { status: 'ended' } }
    ).session(session);

    await session.commitTransaction();
    
  } catch (error) {
    // Nếu lỗi 1 cái, chỉ rollback cái đó, các cái khác vẫn chạy tiếp
    await session.abortTransaction();
    console.error(`'Auction ended transaction, rollback ${auctionId}:`, error.message);
  } finally {
    session.endSession();
  }
}

  async getActiveAuctions(): Promise<Design[]> {
    return this.designModel
      .find({ status: 'active' })
      .sort({ endTime: 1 })
      .exec();
  }

  async getUserBids(userId: string): Promise<AuctionBid[]> {
    return this.bidModel
      .find({ bidderId: userId })
      .populate('auctionId')
      .sort({ createdAt: -1 })
      .exec();
  }

   async cancelAuction(id: string){
    return this.designModel.findByIdAndUpdate(id, {status: "cancelled"}).exec();
      
  }
}