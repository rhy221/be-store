import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuctionService } from './auction.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';

@Controller('auctions')
export class AuctionController {
  constructor(private readonly auctionService: AuctionService) {}

  @Post()
 @UseGuards(JwtGuard)
  async createAuction(@Body() createDto: any, @Request() req: any) {
    const sellerId = req.user?.userId || 'temp-seller-id'; // Get from auth
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
    @Body() body: { amount: number },
    @Request() req: any,
  ) {
    const bidderId = req.user?.userId || 'temp-bidder-id'; // Get from auth
    return this.auctionService.placeBid(auctionId, bidderId, body.amount);
  }

  @Get(':id/bids')
  async getBidHistory(@Param('id') auctionId: string) {
    return this.auctionService.getBidHistory(auctionId);
  }

  @Get('user/bids')
 @UseGuards(JwtGuard)
  async getUserBids(@Request() req: any) {
    const userId = req.user?.userId || 'temp-user-id';
    return this.auctionService.getUserBids(userId);
  }
}
