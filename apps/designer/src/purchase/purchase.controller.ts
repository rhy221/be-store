import { Controller, Get, Post, Param, UseGuards, Request, Query } from '@nestjs/common';
import { PurchaseService } from './purchase.service';
import { JwtGuard } from '@app/common/guards/jwt.guard';
import { GetPurchasesDto } from './purchase.dto';

@Controller('purchases')
@UseGuards(JwtGuard)
export class PurchaseController {
  constructor(private readonly purchaseService: PurchaseService) {}

    @Get('my-purchases')
 async getPurchasedProducts(@Request() req, @Query() query: GetPurchasesDto) {
  console.log(query);
    return this.purchaseService.getPurchasedProducts(req.user.userId, query);
  }

  @Post('download/:productId')
  async downloadProduct(@Request() req, @Param('productId') productId: string) {
    return this.purchaseService.downloadProduct(req.user.userId, productId);
  }

  @Get('check/:productId')
  async checkPurchaseStatus(@Request() req, @Param('productId') productId: string) {
    return this.purchaseService.checkPurchaseStatus(req.user.userId, productId);
  }
}