import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
  UploadedFiles,
  Req,
} from '@nestjs/common';
import { AuctionService } from './auction.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { CreateAuctionDto, GetAuctionItemsDto, PlaceBidDto } from './auction.dto';
import { StorageService } from '@app/storage/storage.service';
import { OptionalJwtGuard } from '@app/common/guards/optional-jwt.guard';

@Controller('auctions')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService,
     private readonly storageService: StorageService,
  ) {}

  @Post()
 @UseGuards(JwtGuard)
  async createAuction(
    @UploadedFiles() files: {
            images?: Express.Multer.File[];
            model?: Express.Multer.File;
        }, 
    @Body() createDto: CreateAuctionDto, 
    @Request() req: any
  ) {
    
    const sellerId = req.user?.userId || 'temp-seller-id';
    const res = await this.storageService.upload(files.images?.[0]!, { folder: 'my_app_images' });
 // Get from auth
    return this.auctionService.createAuction(createDto, sellerId);
  }

  @UseGuards(OptionalJwtGuard)
  @Get()
  async getAuctions(@Query() filters: GetAuctionItemsDto,
  @Req() req
      ) {
          const userId = req?.user?.userId; 
    return this.auctionService.getAuctions(filters, userId);
  }

  @Get('active')
  async getActiveAuctions() {
    return this.auctionService.getActiveAuctions();
  }

  @UseGuards(OptionalJwtGuard)
  @Get(':id')
  async getAuctionById(
    @Param('id') id: string,     
  @Request() req: any,
) {
    const viewerId = req?.user?.userId; 
    return this.auctionService.getAuctionById(id, viewerId);
  }

  @Post(':id/bid')
 @UseGuards(JwtGuard)
  async placeBid(
    @Param('id') auctionId: string,
    @Body() body: PlaceBidDto,
    @Request() req: any,
  ) {
    const bidderId = req.user?.userId || 'temp-bidder-id'; // Get from auth
    return this.auctionService.placeBid(auctionId, bidderId, body.amount);
  }

  @Post(':id/cancel')
  async cancelAuctionById(@Param('id') id: string) {
    return this.auctionService.cancelAuction(id);
  }

  @Get(':id/bids')
  async getBidHistory(@Param('id') auctionId: string) {
    const bids = await this.auctionService.getBidHistory(auctionId);
    console.log(bids.length);
    return bids;
  }

  @Get('user/bids')
 @UseGuards(JwtGuard)
  async getUserBids(@Request() req: any) {
    const userId = req.user?.userId || 'temp-user-id';
    return this.auctionService.getUserBids(userId);
  }
}
