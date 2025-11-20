import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Auction } from '@app/database/schemas/auction.schema';
import { AuctionBid } from '@app/database/schemas/auctionBid.schema';
import { DesignerProfile } from '@app/database/schemas/designerProfile.shema';
import { AuctionGateway } from './auction.gateway';
import { Design } from '@app/database/schemas/design.schema';

@Injectable()
export class AuctionService {
  constructor(
    @InjectModel(Auction.name) private readonly auctionModel: Model<Auction>,
    @InjectModel(AuctionBid.name) private readonly bidModel: Model<AuctionBid>,
    @InjectModel(Design.name) private readonly designModel: Model<Design>,
    private readonly auctionGateway: AuctionGateway,
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

  async getAuctions(filters: any): Promise<Design[]> {
    const query: any = {};
    
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.category) {
      query['metadata.category'] = filters.category;
    }

      query.type = "auction"
    
    return this.designModel
          .find(query)
          .sort({ createdAt : -1})
          .limit(filters.limit || 20)
          .exec();
      
    // return this.auctionModel
    //   .find(query)
    //   .sort({ createdAt: -1 })
    //   .limit(filters.limit || 20)
    //   .exec();
  }

  async getAuctionById(id: string): Promise<Design> {
    const auction = await this.designModel.findById(id).exec();
    if (!auction) {
      throw new NotFoundException('Auction not found');
    }
    
    // Increment view count
    await this.auctionModel.updateOne(
      { _id: id },
      { $inc: { viewCount: 1 } }
    );
    
    return auction;
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
        userId: 1 
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
    await this.designModel.updateMany(
      {
        type: "auction",
        status: 'active',
        endTime: { $lte: now },
      },
      { $set: { status: 'ended' } }
    );
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
}