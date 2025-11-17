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
} from '@nestjs/common';
import { AuctionService } from './auction.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { CreateAuctionDto, PlaceBidDto } from './auction.dto';
import { StorageService } from '@app/storage/storage.service';

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

  @Get()
  async getAuctions(@Query() filters: any) {
    return this.auctionService.getAuctions(filters);
  }

  @Get('active')
  async getActiveAuctions() {
    return this.auctionService.getActiveAuctions();
  }

  @Get(':id')
  async getAuctionById(@Param('id') id: string) {
    return this.auctionService.getAuctionById(id);
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
